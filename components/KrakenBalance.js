"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function KrakenBalance({ userId }) {
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  const fetchBalance = async () => {
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setIsFallback(false);

    try {
      console.log("Rufe Kontostand von API ab...");
      const response = await fetch("/api/user/kraken-balance");

      const data = await response.json();

      if (!response.ok) {
        console.error("Fehler-Antwort vom Server:", data);
        throw new Error(data.message || "Fehler beim Abrufen des Kontostands", {
          cause: data,
        });
      }

      console.log("Kontostand erfolgreich abgerufen");

      // Prüfen, ob es sich um Fallback-Daten handelt
      if (data._fallback) {
        console.log("Hinweis: Verwende Test-Daten (Fallback)");
        setIsFallback(true);

        // Originalen Fehler speichern, falls vorhanden
        if (data._error) {
          setErrorDetails("Original API-Fehler: " + data._error);
        }
      }

      setBalanceData(data);
      setLoading(false);
    } catch (err) {
      console.error("Fehler beim Laden des Kontostands:", err);

      // Versuche, zusätzliche Fehlerinformationen zu extrahieren
      let details = null;
      if (err.cause) {
        details = err.cause.details || err.cause.error;
      }

      setError(err.message);
      setErrorDetails(details);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const formatBitcoin = (value) => {
    return new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    }).format(value);
  };

  const refreshBalance = () => {
    toast.promise(fetchBalance(), {
      loading: "Kontostand wird aktualisiert...",
      success: "Kontostand aktualisiert",
      error: "Kontostand konnte nicht aktualisiert werden",
    });
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">⚠️</span>
          <h3 className="text-lg font-medium text-red-800">
            Fehler beim Laden des Kontostands
          </h3>
        </div>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        {errorDetails && (
          <div className="mt-2">
            <p className="text-sm text-red-600">{errorDetails}</p>
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700">Behebung:</p>
              <ul className="list-disc pl-5 text-sm text-gray-600">
                <li>Stelle sicher, dass deine API-Keys korrekt sind</li>
                <li>
                  Überprüfe, ob dein API-Key die Berechtigung &quot;Query
                  funds&quot; besitzt
                </li>
                <li>
                  Falls du die Keys gerade erstellt hast, warte einige Minuten,
                  bis sie aktiv sind
                </li>
                <li>
                  Falls das Problem weiterhin besteht, versuche neue API-Keys zu
                  erstellen
                </li>
              </ul>
            </div>
            <div className="mt-3">
              <button
                onClick={refreshBalance}
                className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Kraken Balance</h2>
        <button
          onClick={refreshBalance}
          disabled={loading}
          className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
        >
          {loading ? "⟳" : "↻"} Refresh
        </button>
      </div>

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
              <strong>Hinweis:</strong> Es werden Test-Daten angezeigt, da keine
              Verbindung zur Kraken-API hergestellt werden konnte.
            </p>
          </div>
          {errorDetails && (
            <p className="mt-1 text-xs text-yellow-700 pl-7">{errorDetails}</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-400">Laden...</div>
        </div>
      ) : balanceData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Euro Balance */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-blue-600 font-bold text-lg">€</span>
                <h3 className="text-lg font-medium text-gray-700">
                  Euro Balance
                </h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(balanceData.euroBalance)}
              </p>
            </div>

            {/* Bitcoin Balance */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-amber-600 font-bold text-lg">₿</span>
                <h3 className="text-lg font-medium text-gray-700">
                  Bitcoin Balance
                </h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatBitcoin(balanceData.btcBalance)} BTC
              </p>
              <p className="text-sm text-gray-600">
                ≈ {formatCurrency(balanceData.btcValueInEuro)}
              </p>
            </div>
          </div>

          {/* Total Value */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg text-gray-700">Total Value</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(balanceData.totalValueInEuro)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">Bitcoin price</span>
              <span className="text-sm font-medium text-gray-700">
                {formatCurrency(balanceData.btcPrice)} / BTC
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500">Keine Daten verfügbar</p>
        </div>
      )}
    </div>
  );
}
