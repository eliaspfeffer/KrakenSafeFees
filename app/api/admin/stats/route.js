import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { connectToDB } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/stats
 * Ruft Statistiken für das Admin-Dashboard ab
 * Nur verfügbar für den Admin (eliaspfeffer@googlemail.com)
 */
export async function GET(req) {
  try {
    // Authentifizierung prüfen
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Prüfen, ob der Benutzer der Admin ist
    if (session.user.email !== "eliaspfeffer@googlemail.com") {
      return NextResponse.json(
        { message: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    // Datenbank-Verbindung aufbauen
    const db = await connectToDB();

    // --- Alle registrierten Benutzer zählen ---
    const totalUsers = await db.collection("users").countDocuments();

    // --- Benutzer mit API-Keys zählen ---
    const usersWithApiKeys = await db.collection("users").countDocuments({
      "krakenApiKeys.public": { $exists: true, $ne: "" },
      "krakenApiKeys.secret": { $exists: true, $ne: "" },
    });

    // --- Gesamteinzahlungen berechnen ---
    const transactions = await db.collection("transactions").find().toArray();

    // Gesamteinzahlungen (alle EUR-Beträge summieren)
    const totalBalance = transactions.reduce(
      (sum, tx) => sum + (tx.eurAmount || 0),
      0
    );

    // Gesamtersparnisse (alle Ersparnisbeträge summieren)
    const totalSavings = transactions.reduce(
      (sum, tx) => sum + ((tx.standardFee || 0) - (tx.actualFee || 0)),
      0
    );

    // Die letzten 10 Transaktionen abrufen
    const recentTransactions = await db
      .collection("transactions")
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()
      .then((txs) =>
        txs.map((tx) => ({
          ...tx,
          feeSavings: (tx.standardFee || 0) - (tx.actualFee || 0),
        }))
      );

    // Statistiken zurückgeben
    return NextResponse.json({
      totalUsers,
      usersWithApiKeys,
      totalBalance,
      totalSavings,
      recentTransactions,
    });
  } catch (error) {
    console.error("Fehler beim Abrufen der Admin-Statistiken:", error);

    return NextResponse.json(
      { message: "Ein Fehler ist aufgetreten", error: error.message },
      { status: 500 }
    );
  }
}
