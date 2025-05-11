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

export class LocalCronManager {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
    this.lastExecution = new Map();
    this.executionCount = new Map();
    this.maxExecutions = new Map();
    this.executionInterval = new Map();
    this.nextExecution = new Map();
  }

  /**
   * Starts the cron manager
   */
  start() {
    if (this.isRunning) {
      console.log("Cron manager is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting local cron manager...");

    // Start the main loop
    this.run();
  }

  /**
   * Stops the cron manager
   */
  stop() {
    if (!this.isRunning) {
      console.log("Cron manager is not running");
      return;
    }

    this.isRunning = false;
    console.log("Stopping local cron manager...");

    // Clear all jobs
    this.jobs.clear();
    this.lastExecution.clear();
    this.executionCount.clear();
    this.maxExecutions.clear();
    this.executionInterval.clear();
    this.nextExecution.clear();
  }

  /**
   * Adds a new job to the cron manager
   * @param {string} name - The name of the job
   * @param {Function} job - The job function to execute
   * @param {number} interval - The interval in milliseconds
   * @param {number} maxExecutions - The maximum number of executions (0 for unlimited)
   */
  addJob(name, job, interval, maxExecutions = 0) {
    if (this.jobs.has(name)) {
      console.log(`Job '${name}' already exists. Updating...`);
    }

    this.jobs.set(name, job);
    this.executionInterval.set(name, interval);
    this.maxExecutions.set(name, maxExecutions);
    this.executionCount.set(name, 0);
    this.lastExecution.set(name, null);
    this.nextExecution.set(name, Date.now() + interval);

    console.log(
      `Added job '${name}' with interval ${interval}ms and max executions: ${
        maxExecutions || "unlimited"
      }`
    );
  }

  /**
   * Removes a job from the cron manager
   * @param {string} name - The name of the job to remove
   */
  removeJob(name) {
    if (!this.jobs.has(name)) {
      console.log(`Job '${name}' not found`);
      return;
    }

    this.jobs.delete(name);
    this.lastExecution.delete(name);
    this.executionCount.delete(name);
    this.maxExecutions.delete(name);
    this.executionInterval.delete(name);
    this.nextExecution.delete(name);

    console.log(`Removed job '${name}'`);
  }

  /**
   * Main loop of the cron manager
   */
  async run() {
    while (this.isRunning) {
      const now = Date.now();

      // Check all jobs
      for (const [name, job] of this.jobs) {
        const nextExec = this.nextExecution.get(name);
        const maxExecs = this.maxExecutions.get(name);
        const execCount = this.executionCount.get(name);

        // Check if job should be executed
        if (now >= nextExec) {
          // Check if maximum executions reached
          if (maxExecs > 0 && execCount >= maxExecs) {
            console.log(
              `Maximum executions (${maxExecs}) reached for job '${name}'. Removing...`
            );
            this.removeJob(name);
            continue;
          }

          try {
            console.log(`Executing job '${name}'...`);
            await job();
            console.log(`Job '${name}' executed successfully`);

            // Update execution tracking
            this.lastExecution.set(name, now);
            this.executionCount.set(name, execCount + 1);
            this.nextExecution.set(
              name,
              now + this.executionInterval.get(name)
            );
          } catch (error) {
            console.error(`Error executing job '${name}':`, error);
          }
        }
      }

      // Sleep for a short time to prevent high CPU usage
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  /**
   * Gets the status of all jobs
   * @returns {Object} - The status of all jobs
   */
  getStatus() {
    const status = {};

    for (const [name, job] of this.jobs) {
      status[name] = {
        isActive: true,
        lastExecution: this.lastExecution.get(name),
        nextExecution: this.nextExecution.get(name),
        executionCount: this.executionCount.get(name),
        maxExecutions: this.maxExecutions.get(name),
        interval: this.executionInterval.get(name),
      };
    }

    return status;
  }

  /**
   * Gets the status of a specific job
   * @param {string} name - The name of the job
   * @returns {Object|null} - The status of the job or null if not found
   */
  getJobStatus(name) {
    if (!this.jobs.has(name)) {
      console.log(`Job '${name}' not found`);
      return null;
    }

    return {
      isActive: true,
      lastExecution: this.lastExecution.get(name),
      nextExecution: this.nextExecution.get(name),
      executionCount: this.executionCount.get(name),
      maxExecutions: this.maxExecutions.get(name),
      interval: this.executionInterval.get(name),
    };
  }
}
