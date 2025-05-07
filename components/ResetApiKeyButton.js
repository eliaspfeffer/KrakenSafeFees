"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function ResetApiKeyButton({ userId }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    // Bestätigungsdialog (optional, aber empfohlen)
    if (
      !confirm(
        "Möchten Sie Ihre API-Keys wirklich zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden."
      )
    ) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/api-keys", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        // Der Body ist optional, wenn die userId aus der Session im Backend geholt wird,
        // aber wir können sie zur Sicherheit mitsenden.
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Fehler beim Zurücksetzen der API-Keys"
        );
      }

      toast.success("API-Keys erfolgreich zurückgesetzt!");

      // Seite neu laden, um die UI zu aktualisieren (ApiKeyForm sollte wieder erscheinen)
      router.refresh();
    } catch (error) {
      console.error("Error resetting API keys:", error);
      toast.error(error.message || "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleReset}
      className={`btn btn-outline btn-error ${isLoading ? "loading" : ""}`}
      disabled={isLoading}
    >
      {isLoading ? "Wird zurückgesetzt..." : "API Keys zurücksetzen"}
    </button>
  );
}
