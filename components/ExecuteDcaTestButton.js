"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

/**
 * Button zum manuellen Testen der DCA-Ausführung
 * Diese Komponente ist nur für Entwicklungs- und Testzwecke gedacht
 */
export default function ExecuteDcaTestButton({ userId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [result, setResult] = useState(null);

  // Ausführung des DCA-Prozesses
  const handleExecuteTest = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/user/execute-dca-test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ein Fehler ist aufgetreten");
      }

      const data = await response.json();
      setResult(data);

      if (data.result.processed && data.result.processed > 0) {
        toast.success(
          `${data.result.processed} DCA-Aufträge erfolgreich ausgeführt!`
        );
      } else {
        toast.info(
          "Keine fälligen DCA-Aufträge gefunden. Versuchen Sie, das nächste Ausführungsdatum auf jetzt zu setzen."
        );
      }
    } catch (error) {
      console.error("Fehler beim Ausführen des DCA-Tests:", error);
      toast.error(error.message || "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  // Setzt das nächste Ausführungsdatum auf jetzt
  const handleSetToNow = async () => {
    setIsScheduling(true);

    try {
      const response = await fetch("/api/user/set-dca-to-now", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ein Fehler ist aufgetreten");
      }

      const data = await response.json();
      toast.success("Nächstes Ausführungsdatum auf jetzt gesetzt!");

      // Seite neu laden, um aktualisierte Daten anzuzeigen
      window.location.reload();
    } catch (error) {
      console.error("Fehler beim Setzen des Ausführungsdatums:", error);
      toast.error(error.message || "Ein Fehler ist aufgetreten");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExecuteTest}
          className={`btn btn-secondary ${isLoading ? "loading" : ""}`}
          disabled={isLoading || isScheduling}
        >
          {isLoading ? "Executing..." : "Run DCA Process"}
        </button>

        <button
          onClick={handleSetToNow}
          className={`btn btn-outline btn-secondary ${
            isScheduling ? "loading" : ""
          }`}
          disabled={isLoading || isScheduling}
        >
          {isScheduling ? "Updating..." : "Set execution date to now"}
        </button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-base-300 rounded-lg">
          <h4 className="font-bold mb-2">Test Execution Result:</h4>
          <pre className="text-xs overflow-auto max-h-48">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
