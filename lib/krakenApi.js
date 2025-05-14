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
    console.log(`Anfrage an Kraken API: ${endpoint}`);

    const url = "https://api.kraken.com" + endpoint;
    const nonce = Date.now().toString();

    // Parameter für den Request (als URL-kodierte Daten)
    const requestParams = { ...params, nonce };
    const postData = querystring.stringify(requestParams);

    console.log("URL-kodierte Daten für Request vorbereitet");
    // Keine API-Key-Logs mehr

    // Wir verwenden dieselben URL-kodierten Daten für die Signatur
    const signaturePayloadString = nonce + postData;
    console.log("Signatur wird generiert...");

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

    console.log("Sende Anfrage an Kraken API...");

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: postData, // URL-kodierte Daten senden
    });

    // Antwort als Text abrufen
    const responseText = await response.text();
    console.log("Kraken API Antwort erhalten");

    // Versuche, die Antwort als JSON zu parsen
    let data;
    try {
      data = JSON.parse(responseText);
      // Keine sensiblen Daten loggen
      console.log("Kraken API Antwort erfolgreich geparst");
    } catch (e) {
      console.error("Fehler beim Parsen der Kraken-Antwort als JSON:", e);
      throw new Error(
        `Ungültige Antwort von Kraken: ${responseText.substring(0, 100)}...`
      );
    }

    // Antwort überprüfen
    if (!response.ok) {
      console.error("HTTP-Fehler von Kraken API:", response.status);
      throw new Error(
        `HTTP-Fehler ${response.status}: ${JSON.stringify(data)}`
      );
    }

    // Fehler überprüfen
    if (data.error && data.error.length > 0) {
      console.error("Kraken API-Fehler:", data.error);
      throw new Error(`Kraken API-Fehler: ${data.error.join(", ")}`);
    }

    console.log("Kraken API-Request successful");
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
    console.log("Fetching Kraken balance with updated function...");

    // Get balance
    const balanceData = await krakenRequestV2(
      apiKey,
      apiSecret,
      "/0/private/Balance",
      {}
    );

    // Extract Euro and Bitcoin amounts
    let euroBalance = parseFloat(balanceData.ZEUR || 0);
    let btcBalance = parseFloat(balanceData.XXBT || 0);

    // Get Bitcoin price
    const tickerResponse = await fetch(
      "https://api.kraken.com/0/public/Ticker?pair=XBTEUR"
    );

    const tickerData = await tickerResponse.json();

    if (tickerData.error && tickerData.error.length > 0) {
      throw new Error(
        `Error fetching Bitcoin price: ${tickerData.error.join(", ")}`
      );
    }

    // Extract current Bitcoin price
    const btcPrice = parseFloat(tickerData.result?.XXBTZEUR?.c?.[0] || 0);

    // Calculate Bitcoin value in Euro
    const btcValueInEuro = btcBalance * btcPrice;

    // Calculate total value
    const totalValueInEuro = euroBalance + btcValueInEuro;

    return {
      euroBalance,
      btcBalance,
      btcPrice,
      btcValueInEuro,
      totalValueInEuro,
    };
  } catch (error) {
    console.error("Error fetching Kraken balance:", error);
    throw error;
  }
}

/**
 * Ermittelt den Mindestbestellwert für Bitcoin bei Kraken
 * @returns {Promise<{orderMinBtc: number, orderMinEur: number, btcPrice: number}>} - Der Mindestbestellwert in BTC und EUR sowie der aktuelle Bitcoin-Preis
 */
export async function getMinimumBitcoinOrderForXBTEUR() {
  try {
    console.log("Determining minimum order value for Bitcoin on Kraken...");

    // API endpoint for Asset Pair information
    const url = "https://api.kraken.com/0/public/AssetPairs?pair=XXBTZEUR";

    // Send request
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    // Parse response
    const data = await response.json();

    // Error handling
    if (data.error && data.error.length > 0) {
      throw new Error(`Kraken API Error: ${data.error.join(", ")}`);
    }

    // Extract Bitcoin/Euro pair and minimum order value
    const eurBtcPair = data.result.XXBTZEUR;
    const orderMinBtc = parseFloat(eurBtcPair.ordermin);

    // Get current Bitcoin price to calculate minimum order value in Euro
    const tickerResponse = await fetch(
      "https://api.kraken.com/0/public/Ticker?pair=XBTEUR"
    );

    const tickerData = await tickerResponse.json();

    if (tickerData.error && tickerData.error.length > 0) {
      throw new Error(
        `Error fetching Bitcoin price: ${tickerData.error.join(", ")}`
      );
    }

    // Extract current Bitcoin price
    const btcPrice = parseFloat(tickerData.result?.XXBTZEUR?.c?.[0] || 0);

    // Calculate minimum order value in Euro with safety margin (+5%)
    const orderMinEur = orderMinBtc * btcPrice * 1.05;

    console.log(
      `Minimum order value for Bitcoin on Kraken: ${orderMinBtc} BTC (≈ ${orderMinEur} EUR)`
    );

    return {
      orderMinBtc,
      orderMinEur,
      btcPrice,
    };
  } catch (error) {
    console.error("Error determining minimum order value for Bitcoin:", error);
    throw error;
  }
}

/**
 * Helper function for development purposes - returns test data
 * Used when the regular API is not reachable or authentication fails
 * @returns {Promise<object>} - Simulated balance data
 */
export async function getKrakenBalanceFallback() {
  console.log("Using fallback data for Kraken balance");

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Get current BTC price from a public API (no auth required)
  let btcPrice = 0;
  try {
    const tickerResponse = await fetch(
      "https://api.kraken.com/0/public/Ticker?pair=XBTEUR"
    );
    const tickerData = await tickerResponse.json();
    btcPrice = parseFloat(tickerData.result?.XXBTZEUR?.c?.[0] || 50000);
  } catch (e) {
    console.error("Error fetching Bitcoin price, using default value:", e);
    btcPrice = 50000; // Fallback value if API is not reachable
  }

  // Sample data
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
    console.log(`Starting Bitcoin purchase via Kraken API for ${amount} EUR`);

    // Parameters for the purchase order
    const orderParams = {
      pair: "XBTEUR", // Bitcoin/Euro Trading Pair
      type: "buy", // Purchase order
      ordertype: "market", // Buy at current market price
      volume: "0", // Will be calculated later
      validate: "false", // Actually execute the order, don't just validate
    };

    // Get minimum order value for Bitcoin
    let finalAmount = amount;
    try {
      const { orderMinBtc, orderMinEur } =
        await getMinimumBitcoinOrderForXBTEUR();

      // Check if amount is below minimum order value
      if (finalAmount < orderMinEur) {
        if (useMinimumAmount) {
          console.log(
            `Amount (${finalAmount} EUR) too low. Using minimum order value: ${orderMinEur} EUR`
          );
          finalAmount = orderMinEur;
        } else {
          throw new Error(
            `Bitcoin purchase not possible: Minimum order value of ${orderMinEur.toFixed(
              2
            )} EUR not met. Current amount: ${finalAmount.toFixed(2)} EUR`
          );
        }
      }
    } catch (minOrderError) {
      // Only rethrow if it's the expected minimum order value error
      if (
        minOrderError.message &&
        minOrderError.message.includes("Minimum order value")
      ) {
        throw minOrderError;
      }
      // For other errors, continue with original amount
      console.error("Error fetching minimum order value:", minOrderError);
    }

    // Get current Bitcoin price
    const tickerResponse = await fetch(
      "https://api.kraken.com/0/public/Ticker?pair=XBTEUR"
    );

    const tickerData = await tickerResponse.json();

    if (tickerData.error && tickerData.error.length > 0) {
      throw new Error(
        `Error fetching Bitcoin price: ${tickerData.error.join(", ")}`
      );
    }

    // Extract current Bitcoin price (average of Ask and Bid)
    const ask = parseFloat(tickerData.result?.XXBTZEUR?.a?.[0] || 0);
    const bid = parseFloat(tickerData.result?.XXBTZEUR?.b?.[0] || 0);
    const btcPrice = (ask + bid) / 2;

    if (btcPrice <= 0) {
      throw new Error("Bitcoin price could not be determined");
    }

    // Calculated fee of 0.4% + 0.1% for the platform
    const estimatedFee = finalAmount * 0.005;

    // Actual amount to invest considering the fee
    const effectiveAmount = finalAmount - estimatedFee;

    // Calculate volume (BTC amount)
    // We round to 8 decimal places (Kraken standard for Bitcoin)
    const volume = (effectiveAmount / btcPrice).toFixed(8);

    // Add volume to order
    orderParams.volume = volume.toString();

    console.log(
      `Bitcoin purchase: ${volume} BTC at approximately ${btcPrice} EUR/BTC`
    );

    // Send order to Kraken API
    const orderResult = await krakenRequestV2(
      apiKey,
      apiSecret,
      "/0/private/AddOrder",
      orderParams
    );

    console.log("Kraken purchase order successful:", orderResult);

    // Extract order details
    const txid = orderResult.txid?.[0] || "unknown";
    const orderDescr = orderResult.descr?.order || "";

    // Return with all relevant information
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
    console.error("Error executing Bitcoin purchase:", error);

    // Return error information
    return {
      success: false,
      error: error.message,
      status: "failed",
      timestamp: new Date(),
      euroAmount: amount,
    };
  }
}
