import { NextResponse } from "next/server";
import { getMinimumBitcoinOrderForXBTEUR } from "@/lib/krakenApi";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";

/**
 * GET-Handler für /api/user/minimum-order
 * Ruft den Mindestbestellwert für Bitcoin bei Kraken ab
 */
export async function GET() {
  try {
    // Prüfen, ob der Benutzer authentifiziert ist
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Mindestbestellwert für Bitcoin abrufen
    const { orderMinBtc, orderMinEur, btcPrice } =
      await getMinimumBitcoinOrderForXBTEUR();

    // Erfolgreiche Antwort zurückgeben
    return NextResponse.json({
      success: true,
      orderMinBtc,
      orderMinEur,
      btcPrice,
      // Formatierter Mindestbestellwert für die Anzeige
      orderMinEurFormatted: new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(orderMinEur),
    });
  } catch (error) {
    console.error("Fehler beim Abrufen des Mindestbestellwerts:", error);
    return NextResponse.json(
      {
        error: "Mindestbestellwert konnte nicht abgerufen werden",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
