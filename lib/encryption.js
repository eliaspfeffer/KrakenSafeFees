import crypto from "crypto";

// Hinweis: In einer Produktionsumgebung sollte der Verschlüsselungsschlüssel sicher
// in Umgebungsvariablen gespeichert und nicht im Code hinterlegt werden.
// Stellen Sie sicher, dass dieser Schlüssel GENAU 32 Bytes (Zeichen) lang ist.

// Eingebauter Fallback-Schlüssel mit genau 32 Bytes
const FALLBACK_KEY = "ThisIsA32ByteFallbackEncryptionKey!";

let key = process.env.ENCRYPTION_KEY;

// Debug-Ausgabe für die aktuelle Schlüssellänge
console.log(
  `DEBUG: Aktuelle Schlüssellänge (Buffer): ${
    Buffer.from(key, "utf-8").length
  }, Schlüssel: '${key}'`
);

// Strikte Überprüfung der Schlüssellänge als UTF-8 Buffer
if (Buffer.from(key, "utf-8").length !== 32) {
  console.warn(
    `ENCRYPTION_KEY muss genau 32 Bytes lang sein. Aktuelle Länge des Schlüssels '${key}': ${
      Buffer.from(key, "utf-8").length
    } Bytes. Verwende stattdessen Standard-Fallback-Schlüssel.`
  );
  // Wenn der Umgebungsschlüssel nicht die richtige Länge hat, verwenden wir den Fallback-Schlüssel
  key = FALLBACK_KEY;

  console.log(
    `Fallback-Schlüssel wird verwendet. Länge: ${
      Buffer.from(key, "utf-8").length
    } Bytes`
  );
}

const ENCRYPTION_KEY_BUFFER = Buffer.from(key, "utf-8");
console.log(
  `DEBUG: Finale Schlüssellänge (Buffer): ${ENCRYPTION_KEY_BUFFER.length} Bytes`
);

const IV_LENGTH = 16; // Für AES, benötigen wir ein 16 Bytes IV

/**
 * Verschlüsselt die gegebenen Daten mit AES-256-CBC
 * @param {string} text - Der zu verschlüsselnde Text
 * @returns {string} - Der verschlüsselte Text im Format iv:encryptedData
 */
export function encryptData(text) {
  try {
    // Erstelle einen zufälligen Initialisierungsvektor
    const iv = crypto.randomBytes(IV_LENGTH);

    // Erstelle einen Cipher mit unserem Schlüssel und dem IV
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      ENCRYPTION_KEY_BUFFER,
      iv
    );

    // Verschlüssele die Daten
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Gib die IV und die verschlüsselten Daten zurück
    // IV wird als Hex vorangestellt und mit einem Doppelpunkt getrennt
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Fehler bei der Verschlüsselung:", error);
    // Fügen Sie hier spezifischere Fehlerdetails hinzu, falls möglich
    if (error.code === "ERR_CRYPTO_INVALID_KEYLEN") {
      console.error(
        `Detail: Verwendeter Schlüssel (Buffer-Länge): ${ENCRYPTION_KEY_BUFFER.length} Bytes.`
      );
    }
    throw new Error("Fehler bei der Verschlüsselung der Daten");
  }
}

/**
 * Entschlüsselt die gegebenen Daten
 * @param {string} text - Der zu entschlüsselnde Text im Format iv:encryptedData
 * @returns {string} - Der entschlüsselte Text
 */
export function decryptData(text) {
  try {
    // Teile den Text in IV und verschlüsselte Daten
    const textParts = text.split(":");

    if (textParts.length !== 2) {
      throw new Error("Ungültiges Verschlüsselungsformat");
    }

    // Extrahiere IV und verschlüsselte Daten
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = textParts.join(":");

    // Erstelle einen Decipher
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      ENCRYPTION_KEY_BUFFER,
      iv
    );

    // Entschlüssele die Daten
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Fehler bei der Entschlüsselung:", error);
    if (error.code === "ERR_CRYPTO_INVALID_KEYLEN") {
      console.error(
        `Detail: Verwendeter Schlüssel (Buffer-Länge): ${ENCRYPTION_KEY_BUFFER.length} Bytes.`
      );
    }
    throw new Error("Fehler bei der Entschlüsselung der Daten");
  }
}
