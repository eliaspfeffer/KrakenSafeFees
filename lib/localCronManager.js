/**
 * localCronManager.js
 *
 * Simuliert Cron-Jobs in der lokalen Entwicklungsumgebung
 * Kann auch in der Produktion verwendet werden, wenn kein Vercel Cron verfügbar ist
 */

// Für lokale Cron-Jobs
let intervals = {};

// Konfiguration aus Umgebungsvariablen
const LOCAL_CRON_SECRET = process.env.LOCAL_CRON_SECRET || "local-development";
const LOCAL_CRON_TEST_INTERVAL = parseInt(
  process.env.LOCAL_CRON_TEST_INTERVAL || "60000"
);
const LOCAL_CRON_INTERVAL = parseInt(
  process.env.LOCAL_CRON_INTERVAL || "600000"
); // Standard: 10 Minuten (600.000 ms)
const DISABLE_LOCAL_CRON = process.env.DISABLE_LOCAL_CRON === "true";

// Bestimme die Basis-URL für API-Anfragen
const getApiBaseUrl = () => {
  // In der Entwicklungsumgebung verwenden wir localhost
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // In der Produktion verwenden wir entweder die angegebene URL oder relative Pfade
  return process.env.NEXT_PUBLIC_API_BASE_URL || "";
};

/**
 * Startet alle lokalen Cron-Jobs
 */
export function startLocalCronJobs() {
  // Wenn Cron-Jobs explizit deaktiviert sind, nichts tun
  if (DISABLE_LOCAL_CRON) {
    console.log(
      "LocalCronManager: Cron-Jobs sind durch Umgebungsvariable deaktiviert."
    );
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const environment = isProduction ? "Produktionsmodus" : "Entwicklungsmodus";
  console.log(`LocalCronManager: Starte lokale Cron-Jobs (${environment})...`);

  const apiBaseUrl = getApiBaseUrl();

  // DCA-Aufträge mit konfiguriertem Intervall ausführen
  const cronInterval = LOCAL_CRON_INTERVAL;
  console.log(
    `LocalCronManager: Verwende Intervall von ${cronInterval}ms (${
      cronInterval / 60000
    } Minuten)`
  );

  intervals.dcaExecution = setInterval(async () => {
    try {
      console.log("LocalCronManager: Führe DCA-Aufträge aus...");
      const response = await fetch(
        `${apiBaseUrl}/api/cron/execute-dca-orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Wir verwenden den lokalen Secret aus den Umgebungsvariablen
            Authorization: `Bearer ${LOCAL_CRON_SECRET}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "LocalCronManager: Fehler bei der Ausführung der DCA-Aufträge:",
          errorData
        );
      } else {
        const result = await response.json();
        console.log("LocalCronManager: DCA-Aufträge ausgeführt:", result);
      }
    } catch (error) {
      console.error(
        "LocalCronManager: Fehler bei der Ausführung der DCA-Aufträge:",
        error
      );
    }
  }, cronInterval); // Konfiguriertes Intervall verwenden

  // Test-Intervall (nur in der Entwicklungsumgebung)
  if (process.env.NODE_ENV === "development") {
    intervals.dcaExecutionTest = setInterval(async () => {
      try {
        console.log(
          `LocalCronManager: [TEST] Führe DCA-Aufträge aus (Test-Intervall: ${LOCAL_CRON_TEST_INTERVAL}ms)...`
        );
        const response = await fetch(
          `${apiBaseUrl}/api/cron/execute-dca-orders`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LOCAL_CRON_SECRET}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.warn(
            "LocalCronManager: [TEST] Fehler bei der Ausführung der DCA-Aufträge:",
            errorData
          );
        } else {
          const result = await response.json();
          console.log(
            "LocalCronManager: [TEST] DCA-Aufträge ausgeführt:",
            result
          );
        }
      } catch (error) {
        console.warn(
          "LocalCronManager: [TEST] Fehler bei der Ausführung der DCA-Aufträge:",
          error
        );
      }
    }, LOCAL_CRON_TEST_INTERVAL); // Konfigurierbar über Umgebungsvariable
  }
}

/**
 * Stoppt alle lokalen Cron-Jobs
 */
export function stopLocalCronJobs() {
  console.log("LocalCronManager: Beende lokale Cron-Jobs...");

  Object.values(intervals).forEach((interval) => {
    if (interval) clearInterval(interval);
  });

  intervals = {};
}

// Füge eine manuelle Trigger-Funktion hinzu, die den gleichen API-Endpunkt aufruft
export async function manuallyTriggerDcaExecution() {
  console.log("LocalCronManager: Manuelles Triggern der DCA-Aufträge...");
  const apiBaseUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${apiBaseUrl}/api/cron/execute-dca-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOCAL_CRON_SECRET}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        "LocalCronManager: Fehler bei manuellem Trigger:",
        errorData
      );
      return { success: false, error: errorData };
    } else {
      const result = await response.json();
      console.log("LocalCronManager: Manueller Trigger erfolgreich:", result);
      return { success: true, data: result };
    }
  } catch (error) {
    console.error("LocalCronManager: Fehler bei manuellem Trigger:", error);
    return { success: false, error };
  }
}
