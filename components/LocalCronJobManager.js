"use client";

import { useEffect, useState } from "react";
import {
  startLocalCronJobs,
  stopLocalCronJobs,
  manuallyTriggerDcaExecution,
} from "@/lib/localCronManager";
import { toast } from "react-hot-toast";

export default function LocalCronJobManager() {
  const [isRunning, setIsRunning] = useState(false);
  const [nextCheck, setNextCheck] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const isProduction = process.env.NODE_ENV === "production";
  const isCronDisabled = process.env.DISABLE_LOCAL_CRON === "true";

  // Konfigurierte Intervalle aus Umgebungsvariablen lesen
  const cronInterval = parseInt(process.env.LOCAL_CRON_INTERVAL || "600000"); // Standard: 10 Minuten

  // Initialisieren und Aufräumen des Cron-Managers
  useEffect(() => {
    // Wenn Cron-Jobs deaktiviert sind, nichts tun
    if (isCronDisabled) return;

    console.log("LocalCronJobManager: Initialisiere lokalen Cron-Manager...");
    startLocalCronJobs();
    setIsRunning(true);
    updateNextCheckTime();

    // Aufräumen beim Unmount
    return () => {
      console.log("LocalCronJobManager: Räume lokalen Cron-Manager auf...");
      stopLocalCronJobs();
      setIsRunning(false);
    };
  }, [isCronDisabled]);

  // Update des nächsten Check-Zeitpunkts (für Debug-Anzeige)
  const updateNextCheckTime = () => {
    const now = new Date();
    // Verwende das konfigurierte Intervall
    const nextInterval = isProduction
      ? cronInterval
      : parseInt(process.env.LOCAL_CRON_TEST_INTERVAL || "60000");
    const next = new Date(now.getTime() + nextInterval);
    setNextCheck(next);

    // Recursive update every minute
    setTimeout(updateNextCheckTime, 60 * 1000);
  };

  // Manuelles Triggern des Cron-Jobs
  const handleManualTrigger = async () => {
    toast.promise(manuallyTriggerDcaExecution(), {
      loading: "Führe DCA-Aufträge manuell aus...",
      success: "DCA-Aufträge manuell ausgeführt!",
      error: "Fehler beim manuellen Ausführen der DCA-Aufträge",
    });
  };

  // Wenn Cron-Jobs deaktiviert sind, nichts anzeigen
  if (isCronDisabled) return null;

  // Debug-Indikatoren für die Entwicklung und Produktion
  return (
    <>
      {showDebug && (
        <div className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-4 rounded-lg shadow-lg text-sm max-w-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">
              {isProduction
                ? "Lokaler Cron-Manager (PROD)"
                : "Lokaler Cron-Manager (DEV)"}
            </h3>
            <button
              onClick={() => setShowDebug(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  isRunning ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              ></span>
              <span>{isRunning ? "Aktiv" : "Inaktiv"}</span>
            </div>
            {nextCheck && (
              <div className="text-xs opacity-75">
                Nächster Check:{" "}
                {nextCheck.toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  timeZoneName: "short",
                })}
              </div>
            )}
            <button
              onClick={handleManualTrigger}
              className="mt-2 w-full px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
            >
              Manuell ausführen
            </button>
          </div>
          {isProduction && (
            <div className="mt-2 pt-2 border-t border-gray-700 text-xs opacity-75">
              <p>Hinweis: Cron-Manager läuft im Produktionsmodus.</p>
            </div>
          )}
        </div>
      )}
      <div className="fixed bottom-4 right-4 z-50">
        {!showDebug && (
          <button
            onClick={() => setShowDebug(true)}
            className={`p-2 rounded-full shadow-lg transition-colors ${
              isProduction
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-gray-800 hover:bg-gray-700 text-white"
            }`}
            title={isProduction ? "DCA Cron Manager (PROD)" : "DCA Cron Debug"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}
