import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { connectToDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

/**
 * POST /api/user/add-test-transactions
 * Fügt Testdaten für Transaktionen zur Datenbank hinzu
 * Wird nur im Entwicklungsmodus verwendet
 */
export async function POST(req) {
  // Prüfen, ob wir im Entwicklungsmodus sind
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { message: "Nur im Entwicklungsmodus verfügbar" },
      { status: 403 }
    );
  }

  try {
    // Datenbank-Verbindung aufbauen
    const db = await connectToDB();

    let userId;

    // Authentifizierung prüfen
    const session = await getServerSession(authOptions);

    if (session?.user) {
      const userIdStr = session.user.id || session.user._id;

      // Benutzer in der Datenbank finden
      const user = await db.collection("users").findOne({
        $or: [{ _id: userIdStr }, { _id: new ObjectId(userIdStr) }],
      });

      if (user) {
        userId = user._id;
      }
    }

    // Wenn kein Benutzer gefunden wurde, suchen wir nach einem vorhandenen Benutzer
    // oder erstellen einen Test-Benutzer für Entwicklungszwecke
    if (!userId) {
      console.log(
        "Kein authentifizierter Benutzer gefunden, suche nach vorhandenem Benutzer..."
      );

      // Versuche, einen vorhandenen Benutzer zu finden
      const anyUser = await db.collection("users").findOne({});

      if (anyUser) {
        console.log("Vorhandenen Benutzer gefunden:", anyUser._id);
        userId = anyUser._id;
      } else {
        console.log(
          "Kein vorhandener Benutzer gefunden, erstelle Test-Benutzer..."
        );

        // Erstelle einen Test-Benutzer
        const testUser = {
          name: "Test User",
          email: "test@example.com",
          krakenApiKeys: {
            public: "test-key",
            secret: "test-secret",
          },
          dcaSettings: {
            interval: "weekly",
            amount: 100,
            nextExecutionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // eine Woche ab heute
            status: "scheduled",
            updatedAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const insertResult = await db.collection("users").insertOne(testUser);
        userId = insertResult.insertedId;
        console.log("Test-Benutzer erstellt mit ID:", userId);
      }
    }

    // Parameter für Testdaten aus dem Request-Body auslesen
    const body = await req.json();
    const { count = 5 } = body; // Standardmäßig 5 Testdaten erstellen

    // Aktuelle Uhrzeit für die Zeitstempel
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Testdaten erstellen
    const testTransactions = [];
    const beträge = [50, 100, 150, 200, 250];
    const preise = [39500, 40200, 41300, 40800, 42100];

    for (let i = 0; i < count; i++) {
      // Zufälliger Betrag zwischen 50 und 250 Euro
      const betrag = beträge[i % beträge.length];

      // Zufälliger Bitcoin-Preis zwischen 39000 und 43000 Euro
      const btcPreis = preise[i % preise.length];

      // Berechnung des Bitcoin-Betrags
      const btcBetrag = betrag / btcPreis;

      // Gebühren berechnen
      const standardFee = betrag * 0.015; // 1.5% Standardgebühr
      const actualFee = betrag * 0.004; // 0.4% unsere Gebühr

      // Testdaten für eine Transaktion
      testTransactions.push({
        userId,
        btcAmount: btcBetrag,
        eurAmount: betrag,
        btcPrice: btcPreis,
        actualFee,
        standardFee,
        status: "completed",
        notes: "Testdaten für die Entwicklung",
        krakenTxId: `test-${i}-${now}`,
        createdAt: new Date(now - oneDay * (i * 7 + 3)), // Alle 7 Tage eine Transaktion, beginnend vor 3 Tagen
        updatedAt: new Date(now - oneDay * (i * 7 + 3)),
      });
    }

    // Testdaten zur Datenbank hinzufügen
    const result = await db
      .collection("transactions")
      .insertMany(testTransactions);

    return NextResponse.json({
      message: `${result.insertedCount} Testdaten erfolgreich hinzugefügt`,
      insertedIds: result.insertedIds,
      userId: userId.toString(),
    });
  } catch (error) {
    console.error("Fehler beim Hinzufügen von Testdaten:", error);

    return NextResponse.json(
      { message: "Ein Fehler ist aufgetreten", error: error.message },
      { status: 500 }
    );
  }
}
