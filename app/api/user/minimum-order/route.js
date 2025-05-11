import { NextResponse } from "next/server";
import { getMinimumBitcoinOrderForXBTEUR } from "@/lib/krakenApi";

/**
 * GET-Handler für /api/user/minimum-order
 * Ruft den Mindestbestellwert für Bitcoin bei Kraken ab
 */
export async function GET() {
  try {
    console.log("Retrieving minimum order value for Bitcoin...");
    const result = await getMinimumBitcoinOrderForXBTEUR();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error retrieving minimum order value:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error occurred" },
      { status: 500 }
    );
  }
}
