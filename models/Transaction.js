import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

/**
 * TRANSACTION SCHEMA
 * Speichert die durchgeführten Bitcoin-Käufe mit allen relevanten Informationen
 * um Gebührenersparnisse zu berechnen und dem Benutzer anzuzeigen
 */
const transactionSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Der gekaufte Bitcoin-Betrag
    btcAmount: {
      type: Number,
      required: true,
    },
    // Der Kaufbetrag in Euro
    eurAmount: {
      type: Number,
      required: true,
    },
    // Der Bitcoin-Preis zum Kaufzeitpunkt
    btcPrice: {
      type: Number,
      required: true,
    },
    // Die Gebühr, die mit unserem Service anfiel (0.2-0.4% + 0.1% Plattformgebühr)
    actualFee: {
      type: Number,
      required: true,
    },
    // Die Gebühr, die mit der Kraken-App angefallen wäre (ca. 1.5% + Spread)
    standardFee: {
      type: Number,
      required: true,
    },
    // Status der Transaktion (completed, failed, pending)
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    // Weitere Informationen oder Fehlerdetails
    notes: {
      type: String,
    },
    // Transaction ID oder Referenz von Kraken
    krakenTxId: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtuelle Eigenschaft für berechnete Gebührenersparnis
transactionSchema.virtual("feeSavings").get(function () {
  return this.standardFee - this.actualFee;
});

// Plugin hinzufügen, das Mongoose nach JSON konvertiert
transactionSchema.plugin(toJSON);

// Transactions-Model erstellen (wenn es noch nicht existiert)
const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

export default Transaction;
