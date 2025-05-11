import ButtonAccount from "@/components/ButtonAccount";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import { connectToDB } from "@/lib/db";
import { redirect } from "next/navigation";
import ApiKeyForm from "@/components/ApiKeyForm";
import DcaSettingsForm from "@/components/DcaSettingsForm";
import KrakenBalance from "@/components/KrakenBalance";
import ResetApiKeyButton from "@/components/ResetApiKeyButton";
import TransactionHistory from "@/components/TransactionHistory";
import { ObjectId } from "mongodb";
import ExecuteDcaTestButton from "@/components/ExecuteDcaTestButton";

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server component which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/api/auth/signin");
    return null;
  }

  console.log("Dashboard - Session User:", session.user);

  // Get the user's API keys from the database if they exist
  const db = await connectToDB();

  // In NextAuth, the ID is under session.user.id, not session.user._id
  const userIdStr = session.user.id || session.user._id; // Also check _id as a fallback

  console.log("Dashboard - Looking for user with ID:", userIdStr);

  const user = await db.collection("users").findOne({
    $or: [{ _id: userIdStr }, { _id: new ObjectId(userIdStr) }],
  });

  console.log("Dashboard - Found User:", user ? user._id.toString() : null);

  const hasApiKeys = user?.krakenApiKeys?.public && user?.krakenApiKeys?.secret;
  // If DCA settings exist, use them, otherwise use default values
  const dcaSettings = user?.dcaSettings || { interval: "weekly", amount: 100 };

  // Retrieve transactions and savings
  let transactions = [];
  let totalSavings = 0;
  let lastTransaction = null;

  if (hasApiKeys) {
    try {
      transactions = await db
        .collection("transactions")
        .find({
          userId: user._id,
          status: "completed",
        })
        .sort({ createdAt: -1 })
        .toArray();

      totalSavings = transactions.reduce(
        (sum, tx) => sum + (tx.standardFee - tx.actualFee),
        0
      );

      if (transactions.length > 0) {
        lastTransaction = transactions[0];
      }
    } catch (error) {
      console.error("Error retrieving transactions:", error);
    }
  }

  return (
    <main className="min-h-screen p-8 pb-24 bg-base-100">
      <section className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
          <ButtonAccount />
        </div>

        {hasApiKeys && <KrakenBalance userId={userIdStr} />}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl">Your Savings</h2>
            <p>Overview of your fee savings by using our service.</p>

            {hasApiKeys ? (
              <div className="stats shadow mt-4 text-green-600">
                <div className="stat">
                  <div className="stat-title">Total Saved</div>
                  <div className="stat-value">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "EUR",
                    }).format(totalSavings)}
                  </div>
                  <div className="stat-desc">Since activation</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Last Transaction</div>
                  <div className="stat-value">
                    {lastTransaction
                      ? new Intl.DateTimeFormat("en-US").format(
                          new Date(lastTransaction.createdAt)
                        )
                      : "-"}
                  </div>
                  <div className="stat-desc">
                    {lastTransaction
                      ? `${new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "EUR",
                        }).format(lastTransaction.eurAmount)} purchased`
                      : "No transactions yet"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert mt-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-info shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>Set up your API keys to see your savings.</span>
              </div>
            )}
          </div>
        </div>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl">Bitcoin DCA Strategy</h2>
            <p className="my-4">
              Save up to 70% on fees when buying Bitcoin with our automated
              Dollar-Cost Averaging (DCA) strategy. Instead of using the normal
              Kraken app with high fees of about 1.5% + spread, we use your API
              keys to make purchases via Kraken Pro with fees of only 0.2%-0.4%.
            </p>

            <div className="divider"></div>

            {hasApiKeys ? (
              <div className="space-y-6">
                <div className="alert alert-success">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Your API keys are set up! Your DCA strategy is active.
                  </span>
                </div>
                <h3 className="font-bold text-lg">Your DCA Settings</h3>
                <DcaSettingsForm
                  userId={userIdStr}
                  initialSettings={dcaSettings}
                />

                {/* Test button for manual DCA execution */}
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-semibold mb-2">Test DCA Execution</h4>
                  <p className="text-sm mb-3">
                    With this button, you can manually start an execution of the
                    DCA process to test your settings. Only due orders will be
                    executed.
                  </p>
                  <ExecuteDcaTestButton userId={userIdStr} />
                </div>

                <div className="card-actions justify-end">
                  <ResetApiKeyButton userId={userIdStr} />
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-lg mb-4">
                  Set Up Kraken API Keys
                </h3>
                <p className="mb-4">
                  To use our service, we need your Kraken API keys. These are
                  securely stored in our database and only used to execute your
                  Bitcoin purchases.
                </p>
                <a
                  href="https://pro.kraken.com/app/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mb-4 text-blue-600 underline hover:text-blue-800"
                >
                  Go to Kraken API Settings
                </a>
                <div className="alert alert-warning my-4">
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
                    Important: Create API keys with{" "}
                    <strong>trade-only rights</strong>, but{" "}
                    <strong>without withdrawal rights</strong>.
                  </span>
                </div>

                <ApiKeyForm userId={userIdStr} />

                <div className="mt-6">
                  <h4 className="font-semibold mb-2">
                    How to Create Kraken API Keys:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Log in to your Kraken account</li>
                    <li>Go to Security &gt; API</li>
                    <li>Click on &quot;Add new API key&quot;</li>
                    <li>Enable only the trade permission</li>
                    <li>Disable all withdrawal permissions</li>
                    <li>Copy the API key and private key</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {hasApiKeys && (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl">Next Scheduled Purchases</h2>
              <p className="my-2">
                Based on your DCA settings, the next purchase will be executed
                automatically.
              </p>

              <div className="divider"></div>

              {/* Next scheduled purchases */}
              <div className="overflow-x-auto mb-6">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {dcaSettings.nextExecutionDate
                          ? new Intl.DateTimeFormat("en-US", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(dcaSettings.nextExecutionDate))
                          : getNextExecutionDate(dcaSettings.interval)}
                      </td>
                      <td>€{dcaSettings.amount.toFixed(2)}</td>
                      <td>
                        <span
                          className={`badge ${getStatusBadgeClass(
                            dcaSettings.status
                          )}`}
                        >
                          {translateStatus(dcaSettings.status || "scheduled")}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Transaction history */}
              <h3 className="text-xl font-semibold mt-6">
                Completed Purchases
              </h3>
              <div className="mt-2">
                <TransactionHistory userId={userIdStr} />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                All times in{" "}
                {
                  new Date()
                    .toLocaleTimeString("en-US", { timeZoneName: "short" })
                    .split(" ")[1]
                }
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

// Helper function to calculate the next execution date based on the interval
// This function is only used as a fallback if no nextExecutionDate is stored in the database
function getNextExecutionDate(interval) {
  const today = new Date();
  let nextDate = new Date(today);

  switch (interval) {
    case "minutely":
      nextDate.setMinutes(today.getMinutes() + 1);
      break;
    case "hourly":
      nextDate.setHours(today.getHours() + 1);
      break;
    case "daily":
      nextDate.setDate(today.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(today.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(today.getMonth() + 1);
      break;
    default:
      nextDate.setDate(today.getDate() + 7); // Default to one week
  }

  // Format the date with time (Day.Month.Year, Hour:Minute)
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(nextDate);
}

// Helper function to translate the status into an English label
function translateStatus(status) {
  switch (status) {
    case "scheduled":
      return "Scheduled";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Scheduled";
  }
}

// Helper function to determine the CSS class for the status badge
function getStatusBadgeClass(status) {
  switch (status) {
    case "scheduled":
      return "badge-primary";
    case "processing":
      return "badge-warning";
    case "completed":
      return "badge-success";
    case "failed":
      return "badge-error";
    default:
      return "badge-primary";
  }
}
