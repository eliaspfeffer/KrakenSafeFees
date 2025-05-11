import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { connectToDB } from "@/lib/db";
import { decryptData } from "@/lib/encryption";
import { getKrakenBalanceV2, getKrakenBalanceFallback } from "@/lib/krakenApi";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// API-Route zum Abrufen des Kraken-Kontostands
export async function GET(req) {
  try {
    // Authentifizierung prüfen
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Datenbank-Verbindung aufbauen
    const db = await connectToDB();

    // Benutzer aus der Datenbank abrufen
    const user = await db.collection("users").findOne({
      $or: [{ _id: session.user.id }, { _id: new ObjectId(session.user.id) }],
    });

    if (!user) {
      return NextResponse.json(
        { message: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    // Prüfen, ob API-Keys vorhanden sind
    if (
      !user.krakenApiKeys ||
      !user.krakenApiKeys.public ||
      !user.krakenApiKeys.secret
    ) {
      return NextResponse.json(
        { message: "Keine API-Keys vorhanden" },
        { status: 400 }
      );
    }

    // API-Keys aus der Datenbank abrufen
    const publicKey = user.krakenApiKeys.public;
    const encryptedSecretKey = user.krakenApiKeys.secret;

    console.log("API-Keys aus DB abgerufen, entschlüssele Secret Key...");

    // Secret Key entschlüsseln
    const secretKey = decryptData(encryptedSecretKey);

    // WICHTIG: Nur zu Debug-Zwecken, zeigt nur die ersten 5 Zeichen
    console.log(
      "DEBUG - Entschlüsselter Secret Key beginnt mit:",
      secretKey.substring(0, 5)
    );
    // WICHTIG: Diese Zeile nach dem Debugging SOFORT entfernen!

    console.log("Secret Key erfolgreich entschlüsselt, rufe Kontostand ab...");

    try {
      // Kontostand mit der aktualisierten V2-Funktion abrufen
      const balance = await getKrakenBalanceV2(publicKey, secretKey);

      console.log("Kontostand erfolgreich abgerufen, speichere in der DB...");

      // Bei erfolgreicher Abfrage speichern wir die Balance auch in der Datenbank
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            krakenBalance: {
              ...balance,
              updatedAt: new Date(),
            },
          },
        }
      );

      console.log("Kontostand in DB gespeichert, sende Antwort...");

      return NextResponse.json(balance);
    } catch (krakenError) {
      console.error("Detaillierter Fehler bei Kraken-Abfrage:", krakenError);

      // Im Entwicklungsmodus, biete Fallback-Daten an
      if (process.env.NODE_ENV === "development") {
        console.log("Entwicklungsmodus: Verwende Fallback-Daten");
        try {
          const fallbackData = await getKrakenBalanceFallback();
          return NextResponse.json({
            ...fallbackData,
            _fallback: true, // Markiere die Antwort als Fallback
            _error: krakenError.message, // Original-Fehler für Debugging
          });
        } catch (fallbackError) {
          console.error(
            "Fehler beim Erstellen der Fallback-Daten:",
            fallbackError
          );
        }
      }

      // Prüfen, ob der Fehler auf fehlende Berechtigungen hinweist
      const errorMsg = krakenError.message?.toLowerCase() || "";

      if (errorMsg.includes("permission") || errorMsg.includes("invalid key")) {
        return NextResponse.json(
          {
            message: "API-Key hat nicht die erforderlichen Berechtigungen",
            details:
              "Bitte stelle sicher, dass dein API-Key die Berechtigung 'Query funds' besitzt.",
            error: krakenError.message,
          },
          { status: 403 }
        );
      }

      if (errorMsg.includes("invalid signature")) {
        return NextResponse.json(
          {
            message: "Ungültige API-Signatur",
            details:
              "Der Secret Key ist möglicherweise falsch oder wurde nicht richtig übertragen.",
            error: krakenError.message,
          },
          { status: 400 }
        );
      }

      // Allgemeiner Fehler
      return NextResponse.json(
        {
          message: "Fehler beim Abrufen des Kontostands",
          details: "Bitte überprüfe die API-Keys und deren Berechtigungen.",
          error: krakenError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(
      "Allgemeiner Fehler beim Abrufen des Kraken-Kontostands:",
      error
    );

    return NextResponse.json(
      {
        message: "Server-Fehler beim Abrufen des Kontostands",
        error: error.message || "Unbekannter Fehler",
      },
      { status: 500 }
    );
  }
}
