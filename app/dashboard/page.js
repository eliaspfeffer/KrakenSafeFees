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
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
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

  // Bei NextAuth ist die ID unter session.user.id, nicht session.user._id
  const userIdStr = session.user.id || session.user._id; // Als Fallback auch _id prüfen

  console.log("Dashboard - Looking for user with ID:", userIdStr);

  const user = await db.collection("users").findOne({
    $or: [{ _id: userIdStr }, { _id: new ObjectId(userIdStr) }],
  });

  console.log("Dashboard - Found User:", user ? user._id.toString() : null);

  const hasApiKeys = user?.krakenApiKeys?.public && user?.krakenApiKeys?.secret;
  // Falls DCA-Einstellungen vorhanden sind, diese übernehmen, sonst Standardwerte
  const dcaSettings = user?.dcaSettings || { interval: "weekly", amount: 100 };

  // Transaktionen und Einsparungen abrufen
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
      console.error("Fehler beim Abrufen der Transaktionen:", error);
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
            <h2 className="card-title text-2xl">Bitcoin DCA Strategie</h2>
            <p className="my-4">
              Sparen Sie bis zu 90% an Gebühren beim Bitcoin-Kauf mit unserer
              automatisierten Dollar-Cost-Averaging (DCA) Strategie. Anstatt die
              normale Kraken App mit hohen Gebühren von ca. 1.5% + Spread zu
              nutzen, verwenden wir Ihre API-Keys, um Käufe über Kraken Pro mit
              Gebühren von nur 0.2%-0.4% durchzuführen.
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
                    Ihre API Keys sind eingerichtet! Ihre DCA-Strategie ist
                    aktiv.
                  </span>
                </div>
                <h3 className="font-bold text-lg">Ihre DCA-Einstellungen</h3>
                <DcaSettingsForm
                  userId={userIdStr}
                  initialSettings={dcaSettings}
                />

                {/* Test-Button für manuelle DCA-Ausführung */}
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-semibold mb-2">DCA-Ausführung testen</h4>
                  <p className="text-sm mb-3">
                    Mit diesem Button können Sie manuell eine Ausführung des
                    DCA-Prozesses starten, um Ihre Einstellungen zu testen. Es
                    werden nur fällige Aufträge ausgeführt.
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
                  Kraken API Keys einrichten
                </h3>
                <p className="mb-4">
                  Um unseren Service nutzen zu können, benötigen wir Ihre Kraken
                  API Keys. Diese werden sicher in unserer Datenbank gespeichert
                  und nur für die Durchführung Ihrer Bitcoin-Käufe verwendet.
                </p>
                <div className="alert alert-  warning my-4">
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
                    Wichtig: Erstellen Sie API-Keys mit{" "}
                    <strong>nur Handel-Rechten</strong>, aber{" "}
                    <strong>ohne Auszahlungsrechte</strong>.
                  </span>
                </div>

                <ApiKeyForm userId={userIdStr} />

                <div className="mt-6">
                  <h4 className="font-semibold mb-2">
                    So erstellen Sie Kraken API Keys:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Loggen Sie sich in Ihr Kraken-Konto ein</li>
                    <li>Gehen Sie zu Sicherheit &gt; API</li>
                    <li>
                      Klicken Sie auf &quot;Neuen API-Schlüssel hinzufügen&quot;
                    </li>
                    <li>Aktivieren Sie nur die Handelsberechtigung</li>
                    <li>Deaktivieren Sie alle Auszahlungsberechtigungen</li>
                    <li>Kopieren Sie den API-Key und Private Key</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {hasApiKeys && (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl">Nächste geplante Käufe</h2>
              <p className="my-2">
                Basierend auf Ihren DCA-Einstellungen wird der nächste Kauf
                automatisch durchgeführt.
              </p>

              <div className="divider"></div>

              {/* Nächste geplante Käufe */}
              <div className="overflow-x-auto mb-6">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th>Betrag</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {dcaSettings.nextExecutionDate
                          ? new Intl.DateTimeFormat("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              timeZoneName: "short",
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

              {/* Transaktionshistorie */}
              <h3 className="text-xl font-semibold mt-6">
                Durchgeführte Käufe
              </h3>
              <div className="mt-2">
                <TransactionHistory userId={userIdStr} />
              </div>
            </div>
          </div>
        )}

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl">Ihre Einsparungen</h2>
            <p>
              Übersicht Ihrer Gebührenersparnisse durch die Nutzung unseres
              Services.
            </p>

            {hasApiKeys ? (
              <div className="stats shadow mt-4">
                <div className="stat">
                  <div className="stat-title">Insgesamt gespart</div>
                  <div className="stat-value">
                    {new Intl.NumberFormat("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    }).format(totalSavings)}
                  </div>
                  <div className="stat-desc">Seit Aktivierung</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Letzte Transaktion</div>
                  <div className="stat-value">
                    {lastTransaction
                      ? new Intl.DateTimeFormat("de-DE").format(
                          new Date(lastTransaction.createdAt)
                        )
                      : "-"}
                  </div>
                  <div className="stat-desc">
                    {lastTransaction
                      ? `${new Intl.NumberFormat("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        }).format(lastTransaction.eurAmount)} gekauft`
                      : "Noch keine Transaktionen"}
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
                <span>
                  Richten Sie Ihre API-Keys ein, um Ihre Einsparungen zu sehen.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// Hilfsfunktion, um das nächste Ausführungsdatum basierend auf dem Intervall zu berechnen
// Diese Funktion wird nur noch als Fallback verwendet, wenn kein nextExecutionDate in der Datenbank gespeichert ist
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
      nextDate.setDate(today.getDate() + 7); // Standardmäßig eine Woche
  }

  // Formatiere das Datum mit Uhrzeit (Tag.Monat.Jahr, Stunde:Minute)
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(nextDate);
}

// Hilfsfunktion, um den Status in eine deutsche Bezeichnung zu übersetzen
function translateStatus(status) {
  switch (status) {
    case "scheduled":
      return "Geplant";
    case "processing":
      return "Wird ausgeführt";
    case "completed":
      return "Abgeschlossen";
    case "failed":
      return "Fehlgeschlagen";
    default:
      return "Geplant";
  }
}

// Hilfsfunktion, um die CSS-Klasse für den Status-Badge zu ermitteln
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
