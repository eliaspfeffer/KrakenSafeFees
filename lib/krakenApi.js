import crypto from "crypto";
import querystring from "querystring";

/**
 * Allgemeine Funktion für Anfragen an die Kraken API
 * @param {string} apiKey - Der API-Key
 * @param {string} apiSecret - Der API-Secret-Key
 * @param {string} endpoint - Der API-Endpunkt
 * @param {object} params - Die Parameter für die Anfrage (wird URL-kodiert)
 * @returns {Promise<object>} - Die API-Antwort
 */
export async function krakenRequest(apiKey, apiSecret, endpoint, params = {}) {
  try {
    console.log(`Anfrage an Kraken API: ${endpoint} mit Parametern:`, params);

    const url = "https://api.kraken.com" + endpoint;
    const nonce = Date.now().toString();

    // Parameter für den Request (als URL-kodierte Daten)
    const requestParams = { ...params, nonce };
    const postData = querystring.stringify(requestParams);

    console.log("URL-kodierte Daten für Request (postData):", postData);
    console.log("API-Key (erste 5 Zeichen):", apiKey?.substring(0, 5) + "...");

    // Wir verwenden dieselben URL-kodierten Daten für die Signatur
    const signaturePayloadString = nonce + postData;
    console.log(
      "String für SHA256-Hash der Signatur (nonce + postData):",
      signaturePayloadString
    );

    const apiPath = endpoint;
    const secret = Buffer.from(apiSecret, "base64");
    const sha256 = crypto.createHash("sha256");
    sha256.update(signaturePayloadString);
    const hash = sha256.digest();
    const hmac = crypto.createHmac("sha512", secret);
    hmac.update(apiPath + hash);
    const signature = hmac.digest("base64");

    const headers = {
      "API-Key": apiKey,
      "API-Sign": signature,
      "Content-Type": "application/x-www-form-urlencoded", // Wir senden URL-kodierte Daten
    };

    console.log("Sende Anfrage an Kraken API mit URL-kodierten Daten...");

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: postData, // URL-kodierte Daten senden
    });

    // Antwort als Text abrufen
    const responseText = await response.text();
    console.log("Kraken API Antwort (Text):", responseText);

    // Versuche, die Antwort als JSON zu parsen
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("Kraken API Antwort (JSON):", JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Fehler beim Parsen der Kraken-Antwort als JSON:", e);
      console.error("Erhaltene Antwort:", responseText);
      throw new Error(
        `Ungültige Antwort von Kraken: ${responseText.substring(0, 100)}...`
      );
    }

    // Antwort überprüfen
    if (!response.ok) {
      console.error("HTTP-Fehler von Kraken API:", response.status, data);
      throw new Error(
        `HTTP-Fehler ${response.status}: ${JSON.stringify(data)}`
      );
    }

    // Fehler überprüfen
    if (data.error && data.error.length > 0) {
      console.error("Kraken API-Fehler:", data.error);
      console.error("Vollständige Fehlerantwort:", data);
      throw new Error(`Kraken API-Fehler: ${data.error.join(", ")}`);
    }

    console.log("Kraken API-Anfrage erfolgreich");
    return data.result;
  } catch (error) {
    console.error("Fehler bei der Kraken API-Anfrage:", error);
    throw error;
  }
}

/**
 * Generiert eine Signatur für die Kraken API gemäß der Implementierung in KrakenSignature.py
 * @param {string} urlpath - Der API-Pfad
 * @param {object} data - Die Request-Daten
 * @param {string} secret - Der API-Secret-Key
 * @returns {string} - Die generierte Signatur
 */
export function getKrakenSignature(urlpath, data, secret) {
  try {
    // Konvertiere die Daten in einen URL-kodierten String
    const postdata = querystring.stringify(data);

    // Erstelle den String für den Hash (nonce + postdata)
    const encoded = data.nonce + postdata;

    // Erstelle den SHA-256 Hash des Strings
    const sha256 = crypto.createHash("sha256");
    sha256.update(encoded);
    const hash = sha256.digest();

    // Kombiniere den Pfad und den Hash
    const message = Buffer.concat([Buffer.from(urlpath), hash]);

    // Erstelle die HMAC-SHA-512 Signatur
    const secret_buffer = Buffer.from(secret, "base64");
    const hmac = crypto.createHmac("sha512", secret_buffer);
    hmac.update(message);

    // Gib die Base64-kodierte Signatur zurück
    return hmac.digest("base64");
  } catch (error) {
    console.error("Fehler bei der Erstellung der Kraken-Signatur:", error);
    throw error;
  }
}

/**
 * Allgemeine Funktion für Anfragen an die Kraken API - Überarbeitete Version
 * @param {string} apiKey - Der API-Key
 * @param {string} apiSecret - Der API-Secret-Key
 * @param {string} endpoint - Der API-Endpunkt
 * @param {object} params - Die Parameter für die Anfrage (wird URL-kodiert)
 * @returns {Promise<object>} - Die API-Antwort
 */
export async function krakenRequestV2(
  apiKey,
  apiSecret,
  endpoint,
  params = {}
) {
  try {
    console.log(`Anfrage an Kraken API V2: ${endpoint}`);

    const url = "https://api.kraken.com" + endpoint;
    const nonce = Math.floor(Date.now() * 1000).toString();

    // Parameter für den Request
    const requestParams = {
      ...params,
      nonce,
    };

    // Erstelle die Signatur
    const signature = getKrakenSignature(endpoint, requestParams, apiSecret);

    // Headers für den Request
    const headers = {
      "API-Key": apiKey,
      "API-Sign": signature,
      "Content-Type": "application/x-www-form-urlencoded",
    };

    // Sende den Request
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: querystring.stringify(requestParams),
    });

    // Parsen der Antwort
    const data = await response.json();

    // Fehlerbehandlung
    if (data.error && data.error.length > 0) {
      throw new Error(`Kraken API-Fehler: ${data.error.join(", ")}`);
    }

    return data.result;
  } catch (error) {
    console.error("Fehler bei der Kraken API-Anfrage:", error);
    throw error;
  }
}

/**
 * Holt den aktuellen Kontostand von Kraken - Überarbeitete Version gemäß Python-Implementierung
 * @param {string} apiKey - Der API-Key
 * @param {string} apiSecret - Der API-Secret-Key
 * @returns {Promise<object>} - Die Kontostandsdaten
 */
export async function getKrakenBalanceV2(apiKey, apiSecret) {
  try {
    console.log("Rufe Kraken Kontostand mit überarbeiteter Funktion ab...");

    // Balance abrufen
    const balanceData = await krakenRequestV2(
      apiKey,
      apiSecret,
      "/0/private/Balance",
      {}
    );

    // Euro- und Bitcoin-Beträge extrahieren
    let euroBalance = parseFloat(balanceData.ZEUR || 0);
    let btcBalance = parseFloat(balanceData.XXBT || 0);

    // Bitcoin-Preis abrufen
    const tickerResponse = await fetch(
      "https://api.kraken.com/0/public/Ticker?pair=XBTEUR"
    );

    const tickerData = await tickerResponse.json();

    if (tickerData.error && tickerData.error.length > 0) {
      throw new Error(
        `Fehler beim Abrufen des Bitcoin-Kurses: ${tickerData.error.join(", ")}`
      );
    }

    // Aktuellen Bitcoin-Preis extrahieren
    const btcPrice = parseFloat(tickerData.result?.XXBTZEUR?.c?.[0] || 0);

    // Bitcoin-Wert in Euro berechnen
    const btcValueInEuro = btcBalance * btcPrice;

    // Gesamtwert berechnen
    const totalValueInEuro = euroBalance + btcValueInEuro;

    return {
      euroBalance,
      btcBalance,
      btcPrice,
      btcValueInEuro,
      totalValueInEuro,
    };
  } catch (error) {
    console.error("Fehler beim Abrufen des Kraken-Kontostands:", error);
    throw error;
  }
}

/**
 * Ermittelt den Mindestbestellwert für Bitcoin bei Kraken
 * @returns {Promise<{orderMinBtc: number, orderMinEur: number}>} - Der Mindestbestellwert in BTC und EUR
 */
export async function getMinimumBitcoinOrderForXBTEUR() {
  try {
    console.log("Ermittle Mindestbestellwert für Bitcoin bei Kraken...");

    // API-Endpunkt für Asset Pair-Informationen
    const url = "https://api.kraken.com/0/public/AssetPairs?pair=XXBTZEUR";

    // Anfrage senden
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    // Antwort parsen
    const data = await response.json();

    // Fehlerbehandlung
    if (data.error && data.error.length > 0) {
      throw new Error(`Kraken API-Fehler: ${data.error.join(", ")}`);
    }

    // Extrahiere das Bitcoin/Euro-Paar und den Mindestbestellwert
    const eurBtcPair = data.result.XXBTZEUR;
    const orderMinBtc = parseFloat(eurBtcPair.ordermin);

    // Aktuellen Bitcoin-Kurs abrufen, um den Mindestbestellwert in Euro zu berechnen
    const tickerResponse = await fetch(
      "https://api.kraken.com/0/public/Ticker?pair=XBTEUR"
    );

    const tickerData = await tickerResponse.json();

    if (tickerData.error && tickerData.error.length > 0) {
      throw new Error(
        `Fehler beim Abrufen des Bitcoin-Kurses: ${tickerData.error.join(", ")}`
      );
    }

    // Aktuellen Bitcoin-Preis extrahieren
    const btcPrice = parseFloat(tickerData.result?.XXBTZEUR?.c?.[0] || 0);

    // Mindestbestellwert in Euro berechnen mit Sicherheitsmarge (+5%)
    const orderMinEur = orderMinBtc * btcPrice * 1.05;

    console.log(
      `Mindestbestellwert für Bitcoin bei Kraken: ${orderMinBtc} BTC (≈ ${orderMinEur} EUR)`
    );

    return {
      orderMinBtc,
      orderMinEur,
    };
  } catch (error) {
    console.error(
      "Fehler beim Ermitteln des Mindestbestellwerts für Bitcoin:",
      error
    );
    throw error;
  }
}

/**
 * Hilfsfunktion für Entwicklungszwecke - liefert Test-Daten zurück
 * Falls die reguläre API nicht erreichbar ist oder die Authentifizierung fehlschlägt
 * @returns {Promise<object>} - Simulierte Kontostandsdaten
 */
export async function getKrakenBalanceFallback() {
  console.log("Verwende Fallback-Daten für Kraken-Kontostand");

  // Simuliere API-Verzögerung
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Aktuellen BTC-Preis von einer öffentlichen API holen (benötigt keine Auth)
  let btcPrice = 0;
  try {
    const tickerResponse = await fetch(
      "https://api.kraken.com/0/public/Ticker?pair=XBTEUR"
    );
    const tickerData = await tickerResponse.json();
    btcPrice = parseFloat(tickerData.result?.XXBTZEUR?.c?.[0] || 50000);
  } catch (e) {
    console.error(
      "Fehler beim Abrufen des Bitcoin-Preises, verwende Standardwert:",
      e
    );
    btcPrice = 50000; // Fallback-Wert wenn API nicht erreichbar
  }

  // Beispieldaten
  const euroBalance = 1234.56;
  const btcBalance = 0.12345678;
  const btcValueInEuro = btcBalance * btcPrice;
  const totalValueInEuro = euroBalance + btcValueInEuro;

  return {
    euroBalance,
    btcBalance,
    btcPrice,
    btcValueInEuro,
    totalValueInEuro,
  };
}

/**
 * Führt einen Bitcoin-Kauf bei Kraken durch
 * @param {string} apiKey - Der API-Key
 * @param {string} apiSecret - Der API-Secret-Key
 * @param {number} amount - Der zu investierende Euro-Betrag
 * @param {boolean} useMinimumAmount - Wenn true, wird der Mindestbestellwert verwendet, falls der amount zu niedrig ist
 * @returns {Promise<object>} - Die Transaktionsdaten
 */
export async function buyBitcoin(
  apiKey,
  apiSecret,
  amount,
  useMinimumAmount = false
) {
  try {
    console.log(`Starte Bitcoin-Kauf über Kraken API für ${amount} EUR`);

    // Parameter für den Kaufauftrag
    const orderParams = {
      pair: "XBTEUR", // Bitcoin/Euro Trading Pair
      type: "buy", // Kaufauftrag
      ordertype: "market", // Zum aktuellen Marktpreis kaufen
      volume: "0", // Wird später berechnet
      validate: "false", // Auftrag tatsächlich ausführen, nicht nur validieren
    };

    // Mindestbestellwert für Bitcoin abrufen
    let finalAmount = amount;
    try {
      const { orderMinBtc, orderMinEur } =
        await getMinimumBitcoinOrderForXBTEUR();

      // Prüfen, ob der Betrag unter dem Mindestbestellwert liegt
      if (finalAmount < orderMinEur) {
        if (useMinimumAmount) {
          console.log(
            `Betrag (${finalAmount} EUR) zu niedrig. Verwende Mindestbestellwert: ${orderMinEur} EUR`
          );
          finalAmount = orderMinEur;
        } else {
          throw new Error(
            `Bitcoin-Kauf nicht möglich: Mindestbestellwert von ${orderMinEur.toFixed(
              2
            )} EUR unterschritten. Aktueller Betrag: ${finalAmount.toFixed(
              2
            )} EUR`
          );
        }
      }
    } catch (minOrderError) {
      // Nur weiterwerfen, wenn es der erwartete Fehler zum Mindestbestellwert ist
      if (
        minOrderError.message &&
        minOrderError.message.includes("Mindestbestellwert")
      ) {
        throw minOrderError;
      }
      // Bei anderen Fehlern mit dem ursprünglichen Betrag fortfahren
      console.error(
        "Fehler beim Abrufen des Mindestbestellwerts:",
        minOrderError
      );
    }

    // Aktuellen Bitcoin-Preis abrufen
    const tickerResponse = await fetch(
      "https://api.kraken.com/0/public/Ticker?pair=XBTEUR"
    );

    const tickerData = await tickerResponse.json();

    if (tickerData.error && tickerData.error.length > 0) {
      throw new Error(
        `Fehler beim Abrufen des Bitcoin-Kurses: ${tickerData.error.join(", ")}`
      );
    }

    // Aktuellen Bitcoin-Preis extrahieren (Durchschnitt aus Ask und Bid)
    const ask = parseFloat(tickerData.result?.XXBTZEUR?.a?.[0] || 0);
    const bid = parseFloat(tickerData.result?.XXBTZEUR?.b?.[0] || 0);
    const btcPrice = (ask + bid) / 2;

    if (btcPrice <= 0) {
      throw new Error("Bitcoin-Preis konnte nicht ermittelt werden");
    }

    // Berechnete Gebühr von 0.4% + 0.1% für die Plattform
    const estimatedFee = finalAmount * 0.005;

    // Tatsächlich zu investierender Betrag unter Berücksichtigung der Gebühr
    const effectiveAmount = finalAmount - estimatedFee;

    // Volumen (BTC-Menge) berechnen
    // Wir runden auf 8 Dezimalstellen (Kraken-Standard für Bitcoin)
    const volume = (effectiveAmount / btcPrice).toFixed(8);

    // Volumen zum Auftrag hinzufügen
    orderParams.volume = volume.toString();

    console.log(
      `Bitcoin-Kauf: ${volume} BTC zum Preis von ca. ${btcPrice} EUR/BTC`
    );

    // Auftrag an die Kraken API senden
    const orderResult = await krakenRequestV2(
      apiKey,
      apiSecret,
      "/0/private/AddOrder",
      orderParams
    );

    console.log("Kraken Kaufauftrag erfolgreich:", orderResult);

    // Order-Details extrahieren
    const txid = orderResult.txid?.[0] || "unknown";
    const orderDescr = orderResult.descr?.order || "";

    // Rückgabe mit allen relevanten Informationen
    return {
      success: true,
      txid: txid,
      orderDescription: orderDescr,
      euroAmount: finalAmount,
      estimatedBtcAmount: parseFloat(volume),
      estimatedBtcPrice: btcPrice,
      timestamp: new Date(),
      status: "completed",
    };
  } catch (error) {
    console.error("Fehler beim Ausführen des Bitcoin-Kaufs:", error);

    // Fehlerinformationen zurückgeben
    return {
      success: false,
      error: error.message,
      status: "failed",
      timestamp: new Date(),
      euroAmount: amount,
    };
  }
}
