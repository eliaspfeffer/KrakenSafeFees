import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { connectToDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

/**
 * API-Route zum Setzen des nächsten DCA-Ausführungsdatums auf jetzt
 * Diese Route ist nur für Testzwecke gedacht und sollte in der Produktion deaktiviert werden.
 */
export async function POST(req) {
  try {
    // Nur im Entwicklungsmodus verfügbar
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { message: "Diese Route ist nur im Entwicklungsmodus verfügbar" },
        { status: 403 }
      );
    }

    // Authentifizierung prüfen
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Request-Body auslesen (falls benötigt)
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || session.user.id;

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

    // Prüfen, ob DCA-Einstellungen vorhanden sind
    if (!user.dcaSettings) {
      return NextResponse.json(
        { message: "Keine DCA-Einstellungen gefunden" },
        { status: 404 }
      );
    }

    // Aktuelles Datum festlegen (5 Minuten in der Vergangenheit, um sicher zu sein)
    const now = new Date();
    now.setMinutes(now.getMinutes() - 5);

    // DCA-Einstellungen für den User aktualisieren
    const result = await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          "dcaSettings.nextExecutionDate": now,
          "dcaSettings.status": "scheduled",
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Benutzer nicht aktualisiert" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Nächstes Ausführungsdatum auf jetzt gesetzt",
      nextExecutionDate: now,
      status: "scheduled",
    });
  } catch (error) {
    console.error("Fehler beim Setzen des DCA-Ausführungsdatums:", error);

    return NextResponse.json(
      { message: "Ein Fehler ist aufgetreten", error: error.message },
      { status: 500 }
    );
  }
}
