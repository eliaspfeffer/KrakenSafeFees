"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function ApiKeyForm({ userId }) {
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!publicKey || !secretKey) {
      toast.error("Bitte beide API-Keys eingeben");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          publicKey,
          secretKey,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ein Fehler ist aufgetreten");
      }

      toast.success("API-Keys erfolgreich gespeichert!");

      // Refresh the page to show the updated UI
      router.refresh();
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast.error(error.message || "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Public API Key</span>
        </label>
        <input
          type="text"
          value={publicKey}
          onChange={(e) => setPublicKey(e.target.value)}
          className="input input-bordered w-full"
          placeholder="Kraken Public API Key"
          required
        />
      </div>

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Secret API Key</span>
        </label>
        <input
          type="password"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          className="input input-bordered w-full"
          placeholder="Kraken Secret API Key"
          required
        />
        <label className="label">
          <span className="label-text-alt text-warning">
            Der Secret Key wird sicher verschlüsselt gespeichert
          </span>
        </label>
      </div>

      <div className="form-control mt-6">
        <button
          type="submit"
          className={`btn btn-primary ${isLoading ? "loading" : ""}`}
          disabled={isLoading}
        >
          {isLoading ? "Speichert..." : "API Keys speichern"}
        </button>
      </div>
    </form>
  );
}
