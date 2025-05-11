import { connectToDB } from "@/lib/db";
import { decryptData } from "@/lib/encryption";
import { buyBitcoin } from "@/lib/krakenApi";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
// Das Mongoose-Model wird nicht direkt importiert, weil wir direkt mit MongoDB arbeiten
// import Transaction from "@/models/Transaction";

// Hilfsfunktion zur Berechnung des nächsten Ausführungsdatums
function getNextExecutionDate(interval) {
  const today = new Date();
  let nextDate = new Date(today);

  switch (interval) {
    case "minutely":
      nextDate.setMinutes(today.getMinutes() + 1);
      break;
    case "hourly":
      nextDate.setHours(today.getHours() + 1);
      break;
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
      nextDate.setDate(today.getDate() + 7); // Standard: eine Woche
  }

  return nextDate;
}

// Funktion zur Berechnung der Standard-Gebühr (die bei Kraken App angefallen wäre)
function calculateStandardFee(amount) {
  // Kraken App Gebühr: ~1.5% + Spread von ~0.5%
  return amount * 0.01;
}

// Funktion zur Berechnung der tatsächlichen Gebühr
function calculateActualFee(amount) {
  // 0.4% Basis-Gebühr + 0.1% Plattform-Gebühr
  return amount * 0.005;
}

/**
 * API-Route zum Ausführen anstehender DCA-Aufträge (POST-Methode)
 * Diese Route wird von einem Vercel Cron Job alle 10 Minuten aufgerufen
 */
export async function POST() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's DCA settings
    const user = await connectToDB()
      .collection("users")
      .findOne({
        _id: session.user.id,
        select: {
          krakenApiKey: true,
          krakenApiSecret: true,
          dcaEnabled: true,
          dcaAmount: true,
          dcaInterval: true,
          dcaLastExecution: true,
        },
      });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.dcaEnabled) {
      return NextResponse.json(
        { message: "DCA is not enabled for this user" },
        { status: 200 }
      );
    }

    // Check if enough time has passed since last execution
    const now = new Date();
    const lastExecution = user.dcaLastExecution
      ? new Date(user.dcaLastExecution)
      : null;
    const intervalMs = user.dcaInterval * 60 * 60 * 1000; // Convert hours to milliseconds

    if (lastExecution && now - lastExecution < intervalMs) {
      return NextResponse.json(
        {
          message: "Not enough time has passed since last execution",
          nextExecution: new Date(lastExecution.getTime() + intervalMs),
        },
        { status: 200 }
      );
    }

    // Execute DCA order
    console.log(
      `Executing DCA order for user ${session.user.id} with amount ${user.dcaAmount} EUR`
    );

    const result = await buyBitcoin(
      user.krakenApiKey,
      user.krakenApiSecret,
      user.dcaAmount,
      true // Use minimum amount if necessary
    );

    if (!result.success) {
      throw new Error(result.error || "Unknown error occurred during purchase");
    }

    // Update last execution time
    await connectToDB()
      .collection("users")
      .updateOne({ _id: session.user.id }, { $set: { dcaLastExecution: now } });

    // Create transaction record
    await connectToDB()
      .collection("transactions")
      .insertOne({
        userId: session.user.id,
        type: "DCA",
        amount: user.dcaAmount,
        status: "completed",
        details: JSON.stringify(result),
      });

    return NextResponse.json({
      success: true,
      message: "DCA order executed successfully",
      result,
    });
  } catch (error) {
    console.error("Error executing DCA order:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error occurred" },
      { status: 500 }
    );
  }
}

/**
 * API-Route zum Ausführen anstehender DCA-Aufträge (GET-Methode)
 * Diese Route ermöglicht die Ausführung über GET (falls Vercel dies nutzt)
 */
export async function GET(req) {
  return await executeDCAOrders(req);
}

/**
 * Gemeinsame Funktion zur Ausführung der DCA-Aufträge
 * Extrahiert aus POST und GET, um Code-Duplizierung zu vermeiden
 */
async function executeDCAOrders(req) {
  try {
    // Überprüfung, ob der Request autorisiert ist
    const authHeader = req.headers.get("Authorization");
    const localCronSecret =
      process.env.LOCAL_CRON_SECRET || "local-development";

    // In der Produktionsumgebung sollte ein gültiger Secret Token gesetzt sein
    if (process.env.NODE_ENV === "production") {
      // Überprüfen des Authorization-Headers - akzeptiere sowohl CRON_SECRET als auch LOCAL_CRON_SECRET
      if (
        !authHeader ||
        (authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
          authHeader !== `Bearer ${localCronSecret}`)
      ) {
        console.error("Ungültiger Authorization-Header für Cron-Job");
        return NextResponse.json(
          { message: "Nicht autorisiert" },
          { status: 401 }
        );
      }
      console.log("Produktionsmodus: Autorisierung akzeptiert für Cron-Job");
    } else {
      // In der Entwicklungsumgebung akzeptieren wir den lokalen Secret
      if (authHeader && authHeader !== `Bearer ${localCronSecret}`) {
        console.warn(
          "Entwicklungsmodus: Ungültiger lokaler Authorization-Header"
        );
        // Trotzdem akzeptieren, aber warnen
      }

      console.log(
        "Entwicklungsmodus: Authentifizierung akzeptiert für lokalen Cron-Job"
      );
    }

    console.log("Starte Ausführung von fälligen DCA-Aufträgen");

    // Datenbank-Verbindung aufbauen
    const db = await connectToDB();

    // Aktuelles Datum für den Vergleich
    const currentDate = new Date();

    // Finde alle Benutzer mit fälligen DCA-Aufträgen
    const users = await db
      .collection("users")
      .find({
        "dcaSettings.nextExecutionDate": { $lte: currentDate },
        "dcaSettings.status": "scheduled",
        "krakenApiKeys.public": { $exists: true },
        "krakenApiKeys.secret": { $exists: true },
      })
      .toArray();

    console.log(`${users.length} Benutzer mit fälligen DCA-Aufträgen gefunden`);

    if (users.length === 0) {
      return NextResponse.json({
        message: "Keine fälligen DCA-Aufträge gefunden",
      });
    }

    // Ergebnis-Array für die Protokollierung
    const results = [];

    // Aufträge sequenziell abarbeiten
    for (const user of users) {
      try {
        console.log(`Verarbeite DCA-Auftrag für Benutzer: ${user._id}`);

        // Status auf "processing" setzen, um Race Conditions zu vermeiden
        await db
          .collection("users")
          .updateOne(
            { _id: user._id },
            { $set: { "dcaSettings.status": "processing" } }
          );

        // API-Keys aus der Datenbank abrufen
        const publicKey = user.krakenApiKeys.public;
        const encryptedSecretKey = user.krakenApiKeys.secret;
        const amount = user.dcaSettings.amount;
        const useMinimumAmount = user.dcaSettings.useMinimumAmount === true;

        // Secret Key entschlüsseln
        const secretKey = decryptData(encryptedSecretKey);

        // Führe den Bitcoin-Kauf durch
        const purchaseResult = await buyBitcoin(
          publicKey,
          secretKey,
          amount,
          useMinimumAmount
        );

        // Initialisiere das Transaktionsobjekt für die direkte MongoDB-Speicherung
        let transactionDoc;

        if (purchaseResult.success) {
          // Erfolgreich - erstelle das Transaktionsdokument
          transactionDoc = {
            userId: user._id,
            btcAmount: purchaseResult.estimatedBtcAmount,
            eurAmount: amount,
            btcPrice: purchaseResult.estimatedBtcPrice,
            actualFee: calculateActualFee(amount),
            standardFee: calculateStandardFee(amount),
            status: "completed",
            krakenTxId: purchaseResult.txid,
            notes: `DCA Auftrag automatisch ausgeführt. Order: ${purchaseResult.orderDescription}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          try {
            // Transaktion direkt in der MongoDB speichern (anstatt Mongoose zu verwenden)
            await db.collection("transactions").insertOne(transactionDoc);
            console.log("Transaktion erfolgreich in der Datenbank gespeichert");
          } catch (dbError) {
            // Fehlerbehandlung nur für das Speichern der Transaktion
            console.error("Fehler beim Speichern der Transaktion:", dbError);
            // Wir werfen den Fehler nicht erneut, da der Kauf bereits erfolgreich war
          }

          // Status auf "completed" setzen und nächstes Ausführungsdatum berechnen
          await db.collection("users").updateOne(
            { _id: user._id },
            {
              $set: {
                "dcaSettings.status": "scheduled",
                "dcaSettings.nextExecutionDate": getNextExecutionDate(
                  user.dcaSettings.interval
                ),
                "dcaSettings.updatedAt": new Date(),
              },
            }
          );

          console.log(
            `DCA-Auftrag für Benutzer ${
              user._id
            } erfolgreich ausgeführt. Nächstes Datum: ${getNextExecutionDate(
              user.dcaSettings.interval
            )}`
          );
        } else {
          // Fehlgeschlagen - erstelle das Fehler-Transaktionsdokument
          transactionDoc = {
            userId: user._id,
            btcAmount: 0,
            eurAmount: amount,
            btcPrice: 0,
            actualFee: 0,
            standardFee: calculateStandardFee(amount),
            status: "failed",
            notes: `DCA Auftrag fehlgeschlagen: ${purchaseResult.error}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          try {
            // Fehler-Transaktion direkt in der MongoDB speichern
            await db.collection("transactions").insertOne(transactionDoc);
          } catch (dbError) {
            // Fehlerbehandlung nur für das Speichern der Transaktion
            console.error(
              "Fehler beim Speichern der Fehler-Transaktion:",
              dbError
            );
          }

          // Status zurücksetzen und Fehlgeschlagen markieren
          await db.collection("users").updateOne(
            { _id: user._id },
            {
              $set: {
                "dcaSettings.status": "scheduled",
                "dcaSettings.nextExecutionDate": getNextExecutionDate(
                  user.dcaSettings.interval
                ),
                "dcaSettings.updatedAt": new Date(),
              },
            }
          );

          console.error(
            `DCA-Auftrag für Benutzer ${user._id} fehlgeschlagen:`,
            purchaseResult.error
          );
        }

        // Ergebnis für die Antwort hinzufügen
        results.push({
          userId: user._id.toString(),
          success: purchaseResult.success,
          amount: amount,
          nextExecution: getNextExecutionDate(user.dcaSettings.interval),
        });
      } catch (error) {
        // Fehlerbehandlung für den einzelnen Benutzer
        console.error(
          `Fehler bei der Verarbeitung für Benutzer ${user._id}:`,
          error
        );

        // Status zurücksetzen
        await db
          .collection("users")
          .updateOne(
            { _id: user._id },
            { $set: { "dcaSettings.status": "scheduled" } }
          );

        // Fehlermeldung zum Ergebnis hinzufügen
        results.push({
          userId: user._id.toString(),
          success: false,
          error: error.message,
        });
      }
    }

    // Ergebnis zurückgeben
    return NextResponse.json({
      message: `${results.length} DCA-Aufträge verarbeitet`,
      processed: results.length,
      results: results,
    });
  } catch (error) {
    console.error("Fehler bei der Ausführung der DCA-Aufträge:", error);

    return NextResponse.json(
      { message: "Ein Fehler ist aufgetreten", error: error.message },
      { status: 500 }
    );
  }
}
