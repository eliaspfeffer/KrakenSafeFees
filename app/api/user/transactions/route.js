import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { connectToDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

/**
 * GET /api/user/transactions
 * Ruft die Transaktionen des aktuellen Benutzers ab
 */
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

    const userIdStr = session.user.id || session.user._id;

    // Datenbank-Verbindung aufbauen
    const db = await connectToDB();

    // Benutzer in der Datenbank finden
    const user = await db.collection("users").findOne({
      $or: [{ _id: userIdStr }, { _id: new ObjectId(userIdStr) }],
    });

    if (!user) {
      return NextResponse.json(
        { message: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    const userId = user._id;

    // Transaktionen aus der Datenbank abrufen
    const transactions = await db
      .collection("transactions")
      .find({ userId })
      .sort({ createdAt: -1 }) // Neueste zuerst
      .toArray();

    // Statistiken berechnen
    const totalSavings = transactions.reduce(
      (sum, tx) => sum + (tx.standardFee - tx.actualFee),
      0
    );

    return NextResponse.json({
      transactions,
      totalSavings,
      // Weitere Statistiken können hier hinzugefügt werden
    });
  } catch (error) {
    console.error("Fehler beim Abrufen der Transaktionen:", error);

    // Im Entwicklungsmodus, biete Fallback-Daten an
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Entwicklungsmodus: Verwende Fallback-Daten für Transaktionen"
      );
      try {
        const fallbackData = await getTransactionsFallback();
        return NextResponse.json({
          ...fallbackData,
          _fallback: true, // Markiere die Antwort als Fallback
          _error: error.message, // Original-Fehler für Debugging
        });
      } catch (fallbackError) {
        console.error(
          "Fehler beim Generieren der Fallback-Daten:",
          fallbackError
        );
      }
    }

    return NextResponse.json(
      { message: "Ein Fehler ist aufgetreten", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Alternative für Entwicklungszwecke - Liefert Beispieldaten
 */
export async function getTransactionsFallback() {
  // Simuliere API-Verzögerung
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Beispieldaten für Transaktionen
  return {
    transactions: [
      {
        _id: "tx1",
        btcAmount: 0.00123456,
        eurAmount: 50,
        btcPrice: 40500.32,
        actualFee: 0.25,
        standardFee: 0.75,
        status: "completed",
        createdAt: new Date(Date.now() - 3600000 * 24 * 3), // 3 Tage alt
      },
      {
        _id: "tx2",
        btcAmount: 0.00246912,
        eurAmount: 100,
        btcPrice: 40500.32,
        actualFee: 0.5,
        standardFee: 1.5,
        status: "completed",
        createdAt: new Date(Date.now() - 3600000 * 24 * 10), // 10 Tage alt
      },
      {
        _id: "tx3",
        btcAmount: 0.00370368,
        eurAmount: 150,
        btcPrice: 40500.32,
        actualFee: 0.75,
        standardFee: 2.25,
        status: "completed",
        createdAt: new Date(Date.now() - 3600000 * 24 * 17), // 17 Tage alt
      },
    ],
    totalSavings: 3.0,
  };
}
