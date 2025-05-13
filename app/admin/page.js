"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState({
    totalUsers: 0,
    usersWithApiKeys: 0,
    totalBalance: 0,
    totalSavings: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Überprüfen, ob der Benutzer eingeloggt und berechtigt ist
    if (
      status === "authenticated" &&
      session?.user?.email === "eliaspfeffer@googlemail.com"
    ) {
      fetchAdminStats();
    }
  }, [status, session]);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");

      if (!response.ok) {
        throw new Error(
          `Fehler beim Laden der Admin-Statistiken: ${response.status}`
        );
      }

      const data = await response.json();
      setStats({
        ...data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Fehler beim Laden der Admin-Statistiken:", error);
      setStats((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    }
  };

  // Zeige Ladezustand
  if (stats.isLoading) {
    return (
      <main className="min-h-screen p-8 bg-base-100">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-8">
            Admin Dashboard
          </h1>
          <div className="flex justify-center items-center h-64">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
      </main>
    );
  }

  // Zeige Fehler
  if (stats.error) {
    return (
      <main className="min-h-screen p-8 bg-base-100">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-8">
            Admin Dashboard
          </h1>
          <div className="alert alert-error">
            <span>{stats.error}</span>
          </div>
        </div>
      </main>
    );
  }

  // Format für Währung
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <main className="min-h-screen p-8 bg-base-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="stat bg-base-200 rounded-box shadow p-6">
            <div className="stat-title text-lg">Registrierte Benutzer</div>
            <div className="stat-value text-4xl">{stats.totalUsers}</div>
            <div className="stat-desc mt-2">
              Gesamtzahl der registrierten Benutzer
            </div>
          </div>

          <div className="stat bg-base-200 rounded-box shadow p-6">
            <div className="stat-title text-lg">Benutzer mit API-Keys</div>
            <div className="stat-value text-4xl">{stats.usersWithApiKeys}</div>
            <div className="stat-desc mt-2">
              {stats.totalUsers > 0
                ? `${Math.round(
                    (stats.usersWithApiKeys / stats.totalUsers) * 100
                  )}% der Benutzer`
                : "Keine Benutzer gefunden"}
            </div>
          </div>

          <div className="stat bg-base-200 rounded-box shadow p-6">
            <div className="stat-title text-lg">Gesamtguthaben</div>
            <div className="stat-value text-3xl">
              {formatCurrency(stats.totalBalance)}
            </div>
            <div className="stat-desc mt-2">Gesamtbetrag auf Kraken-Konten</div>
          </div>

          <div className="stat bg-base-200 rounded-box shadow p-6">
            <div className="stat-title text-lg">Gesamtersparnis</div>
            <div className="stat-value text-3xl text-green-600">
              {formatCurrency(stats.totalSavings)}
            </div>
            <div className="stat-desc mt-2">
              Gesparte Gebühren durch unseren Service
            </div>
          </div>
        </div>

        {stats.recentTransactions && stats.recentTransactions.length > 0 && (
          <div className="bg-base-200 rounded-box shadow p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">Letzte Transaktionen</h2>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Betrag (EUR)</th>
                    <th>BTC</th>
                    <th>Ersparnis</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTransactions.map((tx, index) => (
                    <tr key={index}>
                      <td>
                        {new Date(tx.createdAt).toLocaleDateString("de-DE")}
                      </td>
                      <td>{formatCurrency(tx.eurAmount)}</td>
                      <td>{tx.btcAmount.toFixed(8)}</td>
                      <td className="text-green-600">
                        {formatCurrency(tx.feeSavings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
