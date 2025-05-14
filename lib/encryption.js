import crypto from "crypto";

// Der Verschlüsselungsschlüssel muss in der Umgebungsvariablen ENCRYPTION_KEY definiert sein
// und genau 32 Bytes (Zeichen) lang sein.
const key = process.env.ENCRYPTION_KEY;

// Strikte Überprüfung der Schlüssellänge als UTF-8 Buffer
if (!key || Buffer.from(key, "utf-8").length !== 32) {
  console.error(
    "KRITISCHER FEHLER: ENCRYPTION_KEY muss konfiguriert und genau 32 Bytes lang sein."
  );
  console.error(
    "Bitte setzen Sie die ENCRYPTION_KEY Umgebungsvariable mit einem 32 Byte langen Schlüssel."
  );

  if (process.env.NODE_ENV === "production") {
    // In Produktion, beenden wir den Prozess, wenn der Schlüssel nicht korrekt ist
    console.error(
      "Die Anwendung wird beendet, da der Verschlüsselungsschlüssel nicht gültig ist."
    );
    process.exit(1);
  }
}

const ENCRYPTION_KEY_BUFFER = Buffer.from(key, "utf-8");

const IV_LENGTH = 16; // Für AES, benötigen wir ein 16 Bytes IV

/**
 * Verschlüsselt die gegebenen Daten mit AES-256-CBC
 * @param {string} text - Der zu verschlüsselnde Text
 * @returns {string} - Der verschlüsselte Text im Format iv:encryptedData
 */
export function encryptData(text) {
  try {
    if (!key || Buffer.from(key, "utf-8").length !== 32) {
      throw new Error(
        "Verschlüsselungsschlüssel ist nicht korrekt konfiguriert"
      );
    }

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
    if (!key || Buffer.from(key, "utf-8").length !== 32) {
      throw new Error(
        "Verschlüsselungsschlüssel ist nicht korrekt konfiguriert"
      );
    }

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
    throw new Error("Fehler bei der Entschlüsselung der Daten");
  }
}
