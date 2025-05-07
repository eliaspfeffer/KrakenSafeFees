import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { connectToDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// Hilfsfunktion, um das nächste Ausführungsdatum basierend auf dem Intervall zu berechnen
function getNextExecutionDate(interval) {
  const today = new Date();
  let nextDate = new Date(today);

  switch (interval) {
    case "daily":
      nextDate.setDate(today.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(today.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(today.getMonth() + 1);
      break;
    default:
      nextDate.setDate(today.getDate() + 7); // Standardmäßig eine Woche
  }

  return nextDate;
}

// Endpoint zum Speichern der DCA-Einstellungen
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
      console.log("Request body:", body);
    } catch (error) {
      console.error("Fehler beim Parsen des Request-Body:", error);
      return NextResponse.json(
        { message: "Ungültiger Request-Body" },
        { status: 400 }
      );
    }

    const { userId, interval, amount } = body;

    if (!interval || !amount) {
      return NextResponse.json(
        { message: "Intervall und Betrag sind erforderlich" },
        { status: 400 }
      );
    }

    // Wenn der Body leer ist oder userId fehlt, verwenden wir die ID aus der Session
    const actualUserId = userId || session.user.id;

    console.log("Verwende user ID:", actualUserId);
    console.log("Session user ID:", session.user.id);

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

    // Berechne das nächste Ausführungsdatum
    const nextExecutionDate = getNextExecutionDate(interval);
    console.log("Nächstes Ausführungsdatum:", nextExecutionDate);

    // DCA-Einstellungen für den User speichern
    const result = await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          dcaSettings: {
            interval,
            amount: parseFloat(amount),
            nextExecutionDate: nextExecutionDate,
            status: "scheduled",
            updatedAt: new Date(),
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

    return NextResponse.json({
      message: "DCA-Einstellungen erfolgreich gespeichert",
      result: result,
    });
  } catch (error) {
    console.error("Fehler beim Speichern der DCA-Einstellungen:", error);

    return NextResponse.json(
      { message: "Ein Fehler ist aufgetreten", error: error.message },
      { status: 500 }
    );
  }
}

// Endpoint zum Abrufen der DCA-Einstellungen
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

    const userId = session.user.id;

    // Datenbank-Verbindung aufbauen
    const db = await connectToDB();

    // Versuche, den Benutzer mit der ID zu finden
    const user = await db.collection("users").findOne({
      $or: [{ _id: userId }, { _id: new ObjectId(userId) }],
    });

    if (!user) {
      return NextResponse.json(
        { message: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    // Wenn keine DCA-Einstellungen gefunden wurden, geben wir Standardwerte zurück
    const dcaSettings = user.dcaSettings || {
      interval: "weekly",
      amount: 100,
      nextExecutionDate: getNextExecutionDate("weekly"),
      status: "scheduled",
    };

    return NextResponse.json(dcaSettings);
  } catch (error) {
    console.error("Fehler beim Abrufen der DCA-Einstellungen:", error);

    return NextResponse.json(
      { message: "Ein Fehler ist aufgetreten", error: error.message },
      { status: 500 }
    );
  }
}
