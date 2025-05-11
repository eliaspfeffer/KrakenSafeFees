"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

/**
 * Button to manually test DCA execution
 * This component is only for development and testing purposes
 */
export default function ExecuteDcaTestButton({ userId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [result, setResult] = useState(null);

  // Execute DCA process
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
        throw new Error(error.message || "An error occurred");
      }

      const data = await response.json();
      setResult(data);

      if (data.result.processed && data.result.processed > 0) {
        toast.success(
          `${data.result.processed} DCA orders successfully executed!`
        );
      } else {
        toast.info(
          "No pending DCA orders found. Try setting the next execution date to now."
        );
      }
    } catch (error) {
      console.error("Error executing DCA test:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Set the next execution date to now
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
        throw new Error(error.message || "An error occurred");
      }

      const data = await response.json();
      toast.success("Next execution date set to now!");

      // Reload the page to display updated data
      window.location.reload();
    } catch (error) {
      console.error("Error setting execution date:", error);
      toast.error(error.message || "An error occurred");
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
