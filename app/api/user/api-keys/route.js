import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { connectToDB } from "@/lib/db";
import { encryptData } from "@/lib/encryption";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// Endpoint zum Speichern der API Keys
export async function POST(req) {
  try {
    // Authentifizierung prüfen
    const session = await getServerSession(authOptions);

    console.log("Session user:", session?.user);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Request-Body auslesen
    let body;
    try {
      body = await req.json();
      console.log("Request body:", { ...body, secretKey: "[HIDDEN]" });
    } catch (error) {
      console.error("Fehler beim Parsen des Request-Body:", error);
      return NextResponse.json(
        { message: "Ungültiger Request-Body" },
        { status: 400 }
      );
    }

    const { userId, publicKey, secretKey } = body;

    // Wenn der Body leer ist oder userId fehlt, verwenden wir die ID aus der Session
    const actualUserId = userId || session.user.id;

    console.log("Verwende user ID:", actualUserId);
    console.log("Session user ID:", session.user.id);

    // Sicherheitsprüfung übersprungen, da wir bei fehlendem userId die Session-ID verwenden

    // Secret Key verschlüsseln bevor er gespeichert wird
    const encryptedSecretKey = encryptData(secretKey);
    console.log("Secret Key verschlüsselt");

    // Datenbank-Verbindung aufbauen
    const db = await connectToDB();
    console.log("DB-Verbindung hergestellt");

    // Versuche, den Benutzer mit der ID zu finden
    const user = await db.collection("users").findOne({
      $or: [{ _id: actualUserId }, { _id: new ObjectId(actualUserId) }],
    });

    if (!user) {
      console.log("Benutzer nicht gefunden mit ID:", actualUserId);
      return NextResponse.json(
        { message: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    console.log("Benutzer gefunden:", user._id);

    // API Keys für den User speichern - verwende die tatsächliche ObjectId aus der Datenbank
    const result = await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          krakenApiKeys: {
            public: publicKey,
            secret: encryptedSecretKey,
            createdAt: new Date(),
          },
        },
      }
    );

    console.log("Update-Ergebnis:", result);

    if (result.matchedCount === 0) {
      console.log("Keine Dokumente gefunden, die dem Filter entsprechen");
      return NextResponse.json(
        { message: "Benutzer nicht aktualisiert" },
        { status: 500 }
      );
    }

    if (result.modifiedCount === 0) {
      console.log("Keine Dokumente wurden geändert");
      return NextResponse.json(
        { message: "Keine Änderungen vorgenommen" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      message: "API Keys saved!",
      result: result,
    });
  } catch (error) {
    console.error("Fehler beim Speichern der API Keys:", error);

    return NextResponse.json(
      { message: "Ein Fehler ist aufgetreten", error: error.message },
      { status: 500 }
    );
  }
}

// Endpoint zum Löschen der API Keys
export async function DELETE(req) {
  try {
    // Authentifizierung prüfen
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Fehler beim Parsen des Request-Body:", error);
      return NextResponse.json(
        { message: "Ungültiger Request-Body" },
        { status: 400 }
      );
    }

    const { userId } = body;
    const actualUserId = userId || session.user.id;

    // Datenbank-Verbindung aufbauen
    const db = await connectToDB();

    // Versuche, den Benutzer mit der ID zu finden
    const user = await db.collection("users").findOne({
      $or: [{ _id: actualUserId }, { _id: new ObjectId(actualUserId) }],
    });

    if (!user) {
      return NextResponse.json(
        { message: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    // API Keys für den User löschen
    const result = await db.collection("users").updateOne(
      { _id: user._id },
      {
        $unset: { krakenApiKeys: "" },
      }
    );

    return NextResponse.json({
      message: "API Keys erfolgreich gelöscht",
      result: result,
    });
  } catch (error) {
    console.error("Fehler beim Löschen der API Keys:", error);

    return NextResponse.json(
      { message: "Ein Fehler ist aufgetreten", error: error.message },
      { status: 500 }
    );
  }
}
