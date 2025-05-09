"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function DcaSettingsForm({ userId, initialSettings }) {
  const [interval, setInterval] = useState(
    initialSettings?.interval || "weekly"
  );
  const [amount, setAmount] = useState(initialSettings?.amount || 100);
  const [useMinimumAmount, setUseMinimumAmount] = useState(
    initialSettings?.useMinimumAmount || false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [minimumOrder, setMinimumOrder] = useState(null);
  const [isLoadingMinimum, setIsLoadingMinimum] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [euroBalance, setEuroBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const router = useRouter();

  // Vergleichswerte für die Änderungserkennung
  const initialAmount = initialSettings?.amount || 100;
  const initialIntervalValue = initialSettings?.interval || "weekly";
  const initialUseMinimumAmount = initialSettings?.useMinimumAmount || false;

  // Laden des Mindestbestellwerts beim ersten Rendern
  useEffect(() => {
    async function fetchMinimumOrder() {
      try {
        setIsLoadingMinimum(true);
        const response = await fetch("/api/user/minimum-order");
        if (response.ok) {
          const data = await response.json();
          setMinimumOrder(data);
        } else {
          console.error("Fehler beim Abrufen des Mindestbestellwerts");
        }
      } catch (error) {
        console.error("Fehler beim Abrufen des Mindestbestellwerts:", error);
      } finally {
        setIsLoadingMinimum(false);
      }
    }

    fetchMinimumOrder();
  }, []);

  // Laden des aktuellen Kontostands
  useEffect(() => {
    async function fetchBalance() {
      try {
        setIsLoadingBalance(true);
        const response = await fetch("/api/user/kraken-balance");
        if (response.ok) {
          const data = await response.json();
          setEuroBalance(data.euroBalance || 0);
        } else {
          console.error("Fehler beim Abrufen des Kontostands");
        }
      } catch (error) {
        console.error("Fehler beim Abrufen des Kontostands:", error);
      } finally {
        setIsLoadingBalance(false);
      }
    }

    fetchBalance();
  }, []);

  // Effekt zur Erkennung von Änderungen
  useEffect(() => {
    const amountChanged = parseFloat(amount) !== parseFloat(initialAmount);
    const intervalChanged = interval !== initialIntervalValue;
    const useMinimumAmountChanged =
      useMinimumAmount !== initialUseMinimumAmount;

    setHasChanges(amountChanged || intervalChanged || useMinimumAmountChanged);
  }, [
    amount,
    interval,
    useMinimumAmount,
    initialAmount,
    initialIntervalValue,
    initialUseMinimumAmount,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || amount <= 0) {
      toast.error("Bitte geben Sie einen gültigen Betrag ein");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/dca-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          interval,
          amount: parseFloat(amount),
          useMinimumAmount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ein Fehler ist aufgetreten");
      }

      toast.success("DCA-Einstellungen erfolgreich gespeichert!");
      setHasChanges(false);

      // Refresh the page to show the updated UI
      router.refresh();
    } catch (error) {
      console.error("Error saving DCA settings:", error);
      toast.error(error.message || "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  // Prüfung, ob der eingestellte Betrag unter dem Mindestbestellwert liegt
  const isAmountBelowMinimum =
    minimumOrder && parseFloat(amount) < minimumOrder.orderMinEur;

  // Berechnung, wie lange der aktuelle Kontostand reicht
  const calculateTimeRemaining = () => {
    if (euroBalance <= 0 || amount <= 0) return null;

    // Anzahl möglicher Käufe
    const possiblePurchases = Math.floor(euroBalance / parseFloat(amount));
    if (possiblePurchases <= 0) return null;

    // Basierend auf dem Intervall die Zeit berechnen
    let timeUnit = "";
    let timeValue = 0;

    switch (interval) {
      case "minutely":
        timeUnit = possiblePurchases === 1 ? "Minute" : "Minuten";
        timeValue = possiblePurchases;
        break;
      case "hourly":
        timeUnit = possiblePurchases === 1 ? "Stunde" : "Stunden";
        timeValue = possiblePurchases;
        break;
      case "daily":
        if (possiblePurchases < 30) {
          timeUnit = possiblePurchases === 1 ? "Tag" : "Tage";
          timeValue = possiblePurchases;
        } else {
          const months = Math.floor(possiblePurchases / 30);
          timeUnit = months === 1 ? "Monat" : "Monate";
          timeValue = months;
        }
        break;
      case "weekly":
        if (possiblePurchases < 4) {
          timeUnit = possiblePurchases === 1 ? "Woche" : "Wochen";
          timeValue = possiblePurchases;
        } else {
          const months = Math.floor(possiblePurchases / 4);
          timeUnit = months === 1 ? "Monat" : "Monate";
          timeValue = months;
        }
        break;
      case "monthly":
        timeUnit = possiblePurchases === 1 ? "Monat" : "Monate";
        timeValue = possiblePurchases;
        break;
      default:
        return null;
    }

    return { value: timeValue, unit: timeUnit, purchases: possiblePurchases };
  };

  const timeRemaining = calculateTimeRemaining();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control w-full max-w-xs">
        <label className="label">
          <span className="label-text">DCA-Intervall</span>
        </label>
        <select
          className="select select-bordered"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
        >
          <option value="minutely">Minütlich (Test)</option>
          <option value="hourly">Stündlich</option>
          <option value="daily">Täglich</option>
          <option value="weekly">Wöchentlich</option>
          <option value="monthly">Monatlich</option>
        </select>
      </div>

      <div className="form-control w-full max-w-xs">
        <label className="label">
          <span className="label-text">Kaufbetrag (EUR)</span>
        </label>
        <input
          type="number"
          placeholder="100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`input input-bordered w-full max-w-xs ${
            isAmountBelowMinimum ? "input-error" : ""
          }`}
          min="1"
          step="1"
        />
        {minimumOrder && (
          <label className="label">
            <span className="label-text-alt">
              Mindestbestellwert bei Kraken: {minimumOrder.orderMinEurFormatted}
            </span>
          </label>
        )}
        {isAmountBelowMinimum && (
          <div className="alert alert-warning mt-2 p-2 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              Der Betrag liegt unter dem Mindestbestellwert von Kraken.
              Aktivieren Sie die Option unten, um Fehler bei der Order zu
              vermeiden.
            </span>
          </div>
        )}
      </div>

      {minimumOrder && (
        <div className="form-control w-full max-w-xs">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              checked={useMinimumAmount}
              onChange={(e) => setUseMinimumAmount(e.target.checked)}
              className="checkbox checkbox-primary"
            />
            <span className="label-text">
              Immer Mindestbestellwert verwenden, falls nötig
            </span>
          </label>
          <label className="label">
            <span className="label-text-alt">
              Wenn aktiviert, wird automatisch der Mindestbestellwert von Kraken
              verwendet, falls Ihr eingestellter Betrag darunter liegt. So wird
              sichergestellt, dass Ihre Orders immer ausgeführt werden können.
            </span>
          </label>
        </div>
      )}

      {/* Hochrechnung anzeigen */}
      {!isLoadingBalance && euroBalance > 0 && timeRemaining && (
        <div className="alert alert-info mt-2 p-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="stroke-current shrink-0 h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <div className="font-semibold">Hochrechnung:</div>
            <p className="text-sm">
              Ihr aktuelles Euro-Guthaben von {euroBalance.toFixed(2)} € reicht
              für ca. {timeRemaining.value} {timeRemaining.unit} (
              {timeRemaining.purchases} Käufe).
            </p>
          </div>
        </div>
      )}

      {/* Warnung bei ungespeicherten Änderungen */}
      {hasChanges && (
        <div className="alert alert-warning animate-pulse mt-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>
            Sie haben ungespeicherte Änderungen. Bitte speichern Sie die
            Einstellungen!
          </span>
        </div>
      )}

      <div className="card-actions justify-end mt-4">
        <button
          type="submit"
          className={`btn ${hasChanges ? "btn-warning" : "btn-primary"} ${
            isLoading ? "loading" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading
            ? "Speichert..."
            : hasChanges
            ? "Änderungen speichern!"
            : "Einstellungen speichern"}
        </button>
      </div>
    </form>
  );
}
