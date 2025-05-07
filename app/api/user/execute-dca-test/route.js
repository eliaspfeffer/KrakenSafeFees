import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { NextResponse } from "next/server";

/**
 * Test-API-Route zum manuellen Auslösen des DCA-Ausführungsprozesses
 * WICHTIG: Diese Route ist nur im Entwicklungsmodus verfügbar
 */
export async function GET(req) {
  try {
    // Nur im Entwicklungsmodus verfügbar
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { message: "Diese Route ist nur im Entwicklungsmodus verfügbar" },
        { status: 403 }
      );
    }

    // Authentifizierung prüfen (nur angemeldete Benutzer)
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Manuellen Aufruf der Cron-API durchführen
    const cronApiUrl = new URL("/api/cron/execute-dca-orders", req.url);

    // Füge einen "Entwickler"-Header hinzu, um den Aufruf zu identifizieren
    const response = await fetch(cronApiUrl, {
      method: "GET",
      headers: {
        "X-Test-Mode": "true",
        Authorization: `Bearer ${process.env.CRON_SECRET || "dev-mode"}`,
      },
    });

    // Antwort auslesen
    const data = await response.json();

    return NextResponse.json({
      message: "Test-Ausführung des DCA-Prozesses",
      result: data,
    });
  } catch (error) {
    console.error("Fehler beim Test des DCA-Ausführungsprozesses:", error);

    return NextResponse.json(
      { message: "Ein Fehler ist aufgetreten", error: error.message },
      { status: 500 }
    );
  }
}
