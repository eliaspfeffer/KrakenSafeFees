"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import BitcoinPriceChart from "./BitcoinPriceChart";

export default function DcaSettingsForm({ userId, initialSettings }) {
  const [interval, setInterval] = useState(
    initialSettings?.interval || "weekly"
  );
  const [amount, setAmount] = useState(initialSettings?.amount || 100);
  const [useMinimumAmount, setUseMinimumAmount] = useState(
    initialSettings?.useMinimumAmount || true
  );
  const [isLoading, setIsLoading] = useState(false);
  const [minimumOrder, setMinimumOrder] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [euroBalance, setEuroBalance] = useState(0);
  const router = useRouter();

  // Comparison values for change detection
  const initialAmount = initialSettings?.amount || 100;
  const initialIntervalValue = initialSettings?.interval || "weekly";
  const initialUseMinimumAmount = initialSettings?.useMinimumAmount || true;

  // Load the minimum order value on initial rendering
  useEffect(() => {
    async function fetchMinimumOrder() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/user/minimum-order");
        if (response.ok) {
          const data = await response.json();
          setMinimumOrder(data);
        } else {
          console.error("Error fetching minimum order value");
        }
      } catch (error) {
        console.error("Error fetching minimum order value:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMinimumOrder();
  }, []);

  // Load the current account balance
  useEffect(() => {
    async function fetchBalance() {
      try {
        setIsLoadingBalance(true);
        const response = await fetch("/api/user/kraken-balance");
        if (response.ok) {
          const data = await response.json();
          setEuroBalance(data.euroBalance || 0);
        } else {
          console.error("Error fetching account balance");
        }
      } catch (error) {
        console.error("Error fetching account balance:", error);
      } finally {
        setIsLoadingBalance(false);
      }
    }

    fetchBalance();
  }, []);

  // Effect for change detection
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
      toast.error("Please enter a valid amount");
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
        throw new Error(error.message || "An error occurred");
      }

      toast.success("DCA settings saved successfully!");
      setHasChanges(false);

      // Refresh the page to show the updated UI
      router.refresh();
    } catch (error) {
      console.error("Error saving DCA settings:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the set amount is below the minimum order value
  const isAmountBelowMinimum =
    minimumOrder && parseFloat(amount) < minimumOrder.orderMinEur;

  // Calculate how long the current balance will last
  const calculateTimeRemaining = () => {
    if (euroBalance <= 0 || amount <= 0) return null;

    // Number of possible purchases
    const possiblePurchases = Math.floor(euroBalance / parseFloat(amount));
    if (possiblePurchases <= 0) return null;

    // Based on the interval, calculate the time
    let timeUnit = "";
    let timeValue = 0;

    // Calculate end date
    const now = new Date();
    let endDate = new Date(now);

    switch (interval) {
      case "minutely":
        timeUnit = possiblePurchases === 1 ? "Minute" : "Minutes";
        timeValue = possiblePurchases;
        endDate.setMinutes(now.getMinutes() + possiblePurchases);
        break;
      case "hourly":
        timeUnit = possiblePurchases === 1 ? "Hour" : "Hours";
        timeValue = possiblePurchases;
        endDate.setHours(now.getHours() + possiblePurchases);
        break;
      case "daily":
        if (possiblePurchases < 30) {
          timeUnit = possiblePurchases === 1 ? "Day" : "Days";
          timeValue = possiblePurchases;
        } else {
          const months = Math.floor(possiblePurchases / 30);
          timeUnit = months === 1 ? "Month" : "Months";
          timeValue = months;
        }
        endDate.setDate(now.getDate() + possiblePurchases);
        break;
      case "weekly":
        if (possiblePurchases < 4) {
          timeUnit = possiblePurchases === 1 ? "Week" : "Weeks";
          timeValue = possiblePurchases;
        } else {
          const months = Math.floor(possiblePurchases / 4);
          timeUnit = months === 1 ? "Month" : "Months";
          timeValue = months;
        }
        endDate.setDate(now.getDate() + possiblePurchases * 7);
        break;
      case "monthly":
        timeUnit = possiblePurchases === 1 ? "Month" : "Months";
        timeValue = possiblePurchases;
        endDate.setMonth(now.getMonth() + possiblePurchases);
        break;
      default:
        return null;
    }

    // Format date
    const formattedEndDate = endDate.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return {
      value: timeValue,
      unit: timeUnit,
      purchases: possiblePurchases,
      endDate: endDate,
      formattedEndDate,
    };
  };

  const timeRemaining = calculateTimeRemaining();

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">DCA-Interval</span>
          </label>
          <select
            className="select select-bordered"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          >
            <option value="minutely">Minutely (Test)</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Buy amount (EUR)</span>
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
                Minimum order value at Kraken:{" "}
                {minimumOrder.orderMinEurFormatted}
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
                The amount is below the minimum order value of Kraken. Enable
                the option below to avoid errors with the order.
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
                Always use minimum order value if necessary
              </span>
            </label>
            <label className="label">
              <span className="label-text-alt">
                If activated, the minimum order value of Kraken is automatically
                used if your set amount is lower. This ensures that your orders
                can always be executed .
              </span>
            </label>
          </div>
        )}

        {/* Projection display */}
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
              <div className="font-semibold">Projection:</div>
              <p className="text-sm">
                Your current Euro balance of {euroBalance.toFixed(2)} € is
                sufficient for approximately {timeRemaining.value}{" "}
                {timeRemaining.unit} ({timeRemaining.purchases} purchases) until{" "}
                {timeRemaining.formattedEndDate}.
              </p>
            </div>
          </div>
        )}

        {/* Warning for unsaved changes */}
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
            <span>You have unsaved changes. Please save the settings!</span>
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
              ? "Saving..."
              : hasChanges
              ? "Save changes!"
              : "Save settings"}
          </button>
        </div>
      </form>

      {/* Display Bitcoin price chart */}
      {!isLoadingBalance && euroBalance > 0 && timeRemaining && (
        <BitcoinPriceChart
          endDate={timeRemaining.endDate}
          purchaseDuration={timeRemaining.purchases}
          interval={interval}
          amount={parseFloat(amount)}
          currentBtcPrice={minimumOrder?.btcPrice || 80000}
        />
      )}
    </div>
  );
}
