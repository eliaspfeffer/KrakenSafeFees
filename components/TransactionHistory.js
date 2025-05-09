"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";

export default function TransactionHistory({ userId }) {
  const [transactionData, setTransactionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const autoUpdateIntervalRef = useRef(null);

  const fetchTransactions = async (showToast = false) => {
    setLoading(true);
    setError(null);
    setIsFallback(false);

    try {
      console.log("Rufe Transaktionen von API ab...");
      const response = await fetch("/api/user/transactions");

      const data = await response.json();

      if (!response.ok) {
        console.error("Fehler-Antwort vom Server:", data);
        throw new Error(
          data.message || "Fehler beim Abrufen der Transaktionen",
          { cause: data }
        );
      }

      // Prüfen, ob es sich um Fallback-Daten handelt
      if (data._fallback) {
        console.log("Hinweis: Verwende Test-Daten (Fallback)");
        setIsFallback(true);
      }

      setTransactionData(data);
      setLastUpdated(new Date());
      setLoading(false);

      if (showToast) {
        toast.success("Transaktionen aktualisiert");
      }
    } catch (err) {
      console.error("Fehler beim Laden der Transaktionen:", err);
      setError(err.message);
      setLoading(false);

      if (showToast) {
        toast.error("Transaktionen konnten nicht aktualisiert werden");
      }
    }
  };

  // Einmaliges Laden der Transaktionen beim Mounten
  useEffect(() => {
    fetchTransactions();

    // Starte automatisches Update alle 60 Sekunden
    if (autoUpdateEnabled) {
      autoUpdateIntervalRef.current = setInterval(() => {
        console.log("Auto-Update: Aktualisiere Transaktionen...");
        fetchTransactions();
      }, 60000); // 60 Sekunden
    }

    // Cleanup-Funktion
    return () => {
      if (autoUpdateIntervalRef.current) {
        clearInterval(autoUpdateIntervalRef.current);
      }
    };
  }, [autoUpdateEnabled]);

  // Toggle für automatische Aktualisierung
  const toggleAutoUpdate = () => {
    const newState = !autoUpdateEnabled;
    setAutoUpdateEnabled(newState);

    if (!newState && autoUpdateIntervalRef.current) {
      clearInterval(autoUpdateIntervalRef.current);
      autoUpdateIntervalRef.current = null;
      toast.success("Automatische Aktualisierung deaktiviert");
    } else if (newState) {
      // Intervall neu starten
      if (autoUpdateIntervalRef.current) {
        clearInterval(autoUpdateIntervalRef.current);
      }
      autoUpdateIntervalRef.current = setInterval(() => {
        console.log("Auto-Update: Aktualisiere Transaktionen...");
        fetchTransactions();
      }, 60000);
      toast.success("Automatische Aktualisierung aktiviert (alle 60 Sekunden)");
    }
  };

  const refreshTransactions = () => {
    toast.promise(fetchTransactions(true), {
      loading: "Transaktionen werden aktualisiert...",
      success: "Transaktionen aktualisiert",
      error: "Transaktionen konnten nicht aktualisiert werden",
    });
  };

  // Euro formatieren
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  // Bitcoin formatieren
  const formatBitcoin = (value) => {
    return new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    }).format(value);
  };

  // Datum formatieren
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE");
  };

  // Zeit formatieren
  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">⚠️</span>
          <h3 className="text-lg font-medium text-red-800">
            Fehler beim Laden der Transaktionen
          </h3>
        </div>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <div className="mt-3">
          <button
            onClick={refreshTransactions}
            className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Transaktionshistorie</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <label className="cursor-pointer label gap-2">
              <span className="label-text text-xs">Auto-Update</span>
              <input
                type="checkbox"
                className="toggle toggle-sm toggle-primary"
                checked={autoUpdateEnabled}
                onChange={toggleAutoUpdate}
              />
            </label>
          </div>
          <button
            onClick={refreshTransactions}
            disabled={loading}
            className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
          >
            {loading ? "⟳" : "↻"} Aktualisieren
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-xs text-gray-500 mb-2 text-right">
          Letzte Aktualisierung: {formatTime(lastUpdated)}
          {autoUpdateEnabled && (
            <span className="ml-2 inline-block">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
              Auto-Update aktiv
            </span>
          )}
        </div>
      )}

      {isFallback && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-yellow-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                clipRule="evenodd"
              />
            </svg>
            <p>
              <strong>Hinweis:</strong> Es werden Test-Daten angezeigt.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-24">
          <div className="text-gray-400">Laden...</div>
        </div>
      ) : transactionData?.transactions?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Betrag (EUR)</th>
                <th>Bitcoin</th>
                <th>Unsere Gebühr</th>
                <th>Normale Gebühr</th>
                <th>Ersparnis</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactionData.transactions.map((tx) => (
                <tr key={tx._id}>
                  <td>{formatDate(tx.createdAt)}</td>
                  <td>{formatCurrency(tx.eurAmount)}</td>
                  <td>{formatBitcoin(tx.btcAmount)} BTC</td>
                  <td>{formatCurrency(tx.actualFee)}</td>
                  <td>{formatCurrency(tx.standardFee)}</td>
                  <td className="text-green-600 font-medium">
                    {formatCurrency(tx.standardFee - tx.actualFee)}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        tx.status === "completed"
                          ? "badge-success"
                          : tx.status === "pending"
                          ? "badge-warning"
                          : "badge-error"
                      }`}
                    >
                      {tx.status === "completed"
                        ? "Abgeschlossen"
                        : tx.status === "pending"
                        ? "In Bearbeitung"
                        : "Fehlgeschlagen"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            Noch keine Transaktionen durchgeführt.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Die ersten DCA-Käufe werden gemäß Ihren Einstellungen bald
            durchgeführt.
          </p>
        </div>
      )}

      {transactionData?.transactions?.length > 0 && (
        <div className="mt-6 flex justify-end">
          <div className="bg-green-50 border border-green-100 rounded-lg p-4 max-w-xs">
            <div className="text-sm text-green-700">Gesamtersparnis</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(transactionData.totalSavings)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
