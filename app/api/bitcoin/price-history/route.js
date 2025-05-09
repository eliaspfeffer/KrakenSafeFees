import { NextResponse } from "next/server";

/**
 * Erzeugt simulierte historische Bitcoin-Preisdaten
 * @param {number} days - Anzahl der Tage für die Preishistorie
 * @param {number} basePrice - Aktueller Bitcoin-Preis als Ausgangspunkt
 * @returns {Array} - Array mit Datums-Preis-Paaren
 */
function generateMockPriceData(days = 90, basePrice = 80000) {
  const data = [];
  const today = new Date();

  // Volatilität: höhere Werte = mehr Preisschwankungen
  const volatility = 0.02;

  // Tendenz: positive Werte = aufwärts, negative Werte = abwärts
  const trend = 0.0005;

  // Wir generieren die Daten rückwärts, um den heutigen Preis als Ausgangspunkt zu nehmen
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // Zufällige Preisänderung mit leichtem Aufwärtstrend
    const randomChange = (Math.random() * 2 - 1 + trend) * volatility * i;
    // Je weiter in der Vergangenheit, desto niedriger der Preis (im Durchschnitt)
    const price = (basePrice / (1 + trend * i)) * (1 + randomChange);

    data.push({
      date: formatDateForAPI(date),
      price: Math.round(price * 100) / 100, // Auf 2 Nachkommastellen runden
    });
  }

  return data;
}

/**
 * Formatiert ein Datum für die API
 * @param {Date} date - Das zu formatierende Datum
 * @returns {string} - Formatiertes Datum (YYYY-MM-DD)
 */
function formatDateForAPI(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * GET-Handler für /api/bitcoin/price-history
 * Gibt historische Bitcoin-Preisdaten zurück
 */
export async function GET(req) {
  try {
    // Parameter aus der Anfrage extrahieren
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "90");
    const currentPrice = parseFloat(
      searchParams.get("currentPrice") || "80000"
    );

    // Beschränken auf max. 365 Tage
    const daysToFetch = Math.min(365, days);

    // Überprüfen, ob der currentPrice gültig ist
    const basePrice =
      isNaN(currentPrice) || currentPrice <= 0 ? 80000 : currentPrice;

    console.log(
      `Generiere Preishistorie für ${daysToFetch} Tage mit aktuellem Preis: ${basePrice}€`
    );

    // Hier könnte man echte historische Daten von einer externen API abrufen
    // Im Moment simulieren wir die Daten
    const mockPrices = generateMockPriceData(daysToFetch, basePrice);

    return NextResponse.json({
      success: true,
      prices: mockPrices,
      source: "simulated", // Transparente Angabe der Datenquelle
      basePrice: basePrice,
      days: daysToFetch,
    });
  } catch (error) {
    console.error("Fehler beim Abrufen der Bitcoin-Preishistorie:", error);

    return NextResponse.json(
      {
        error: "Fehler beim Abrufen der Bitcoin-Preishistorie",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
