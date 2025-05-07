"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function DcaSettingsForm({ userId, initialSettings }) {
  const [interval, setInterval] = useState(
    initialSettings?.interval || "weekly"
  );
  const [amount, setAmount] = useState(initialSettings?.amount || 100);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ein Fehler ist aufgetreten");
      }

      toast.success("DCA-Einstellungen erfolgreich gespeichert!");

      // Refresh the page to show the updated UI
      router.refresh();
    } catch (error) {
      console.error("Error saving DCA settings:", error);
      toast.error(error.message || "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

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
          className="input input-bordered w-full max-w-xs"
          min="1"
          step="1"
        />
      </div>

      <div className="card-actions justify-end mt-4">
        <button
          type="submit"
          className={`btn btn-primary ${isLoading ? "loading" : ""}`}
          disabled={isLoading}
        >
          {isLoading ? "Speichert..." : "Einstellungen speichern"}
        </button>
      </div>
    </form>
  );
}
