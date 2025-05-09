"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

const CHART_MODES = {
  NORMAL: "normal",
  LOG: "logarithmic",
  DOUBLE_LOG: "double-logarithmic",
};

// Hilfsfunktion zur Generierung von Testdaten, wenn die API nicht funktioniert
function generateMockPriceData(
  days = 90,
  basePrice = 80000,
  volatility = 0.02
) {
  const data = [];
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // Einfaches Random-Walk-Modell für Bitcoin-Preissimulation
    const randomChange = (Math.random() * 2 - 1) * volatility;
    const price = basePrice * (1 + randomChange * i);

    data.push({
      date: formatDateForAPI(date),
      price: price,
    });
  }

  return data;
}

// Helfer-Funktionen für Datumsformatierung
function getFormattedTodayDate() {
  const today = new Date();
  return formatDateForAPI(today);
}

function getDateXDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateForAPI(date);
}

function formatDateForAPI(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

// Füge diese Funktion hinzu, um Farben für verschiedene Jahre zu definieren
function getColorForYear(year) {
  const colors = {
    2023: "#3498db", // Blau
    2024: "#2ecc71", // Grün
    2025: "#e74c3c", // Rot
    2026: "#f39c12", // Orange
    2027: "#9b59b6", // Lila
    2028: "#1abc9c", // Türkis
  };

  return colors[year] || "#95a5a6"; // Grau als Standardfarbe
}

export default function BitcoinPriceChart({
  endDate,
  purchaseDuration,
  interval,
  amount,
  currentBtcPrice = 80000, // Standardwert, falls kein aktueller Preis vorhanden
}) {
  const [chartData, setChartData] = useState([]);
  const [projectedData, setProjectedData] = useState([]); // Neue State-Variable für projizierte Daten
  const [isLoading, setIsLoading] = useState(true);
  const [chartMode, setChartMode] = useState(CHART_MODES.NORMAL);
  const [error, setError] = useState(null);
  const [useMockData, setUseMockData] = useState(false);
  const [yearsInData, setYearsInData] = useState([]);
  const [transformedData, setTransformedData] = useState([]); // Neue State-Variable für transformierte Daten im DOUBLE_LOG Modus

  // Sicherstellen, dass currentBtcPrice eine gültige Zahl ist
  const validBtcPrice =
    typeof currentBtcPrice === "number" &&
    !isNaN(currentBtcPrice) &&
    currentBtcPrice > 0
      ? currentBtcPrice
      : 80000;

  // Abrufen historischer Bitcoin-Preisdaten
  useEffect(() => {
    async function fetchBitcoinPriceHistory() {
      setIsLoading(true);
      setError(null);
      try {
        // Chart-Daten für unterschiedliche Zeiträume unterschiedlich abrufen
        const days = calculateDaysForInterval(purchaseDuration, interval);
        let dataSource = "external"; // Standardmäßig externe Datenquelle verwenden

        // Versuch 1: CoinGecko API für echte historische Bitcoin-Preise (bevorzugt)
        try {
          console.log(`Fetching price history from CoinGecko for ${days} days`);
          // CoinGecko API bietet kostenlose historische Bitcoin-Preisdaten
          const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=eur&days=${days}&interval=daily`;

          const response = await fetch(coingeckoUrl);

          if (response.ok) {
            const data = await response.json();

            if (data && data.prices && data.prices.length > 0) {
              // CoinGecko gibt Preise als [timestamp, price] Arrays zurück
              const chartData = data.prices.map(([timestamp, price]) => ({
                date: formatDateForAPI(new Date(timestamp)),
                price: price,
              }));

              setChartData(chartData);
              setUseMockData(false);
              dataSource = "coingecko";
              console.log("Echte Bitcoin-Preisdaten von CoinGecko geladen");

              // Erstelle zukunftsprojizierte Daten
              createProjectedData(chartData, endDate);

              setIsLoading(false);
              return;
            }
          }
        } catch (coingeckoErr) {
          console.error("CoinGecko API nicht erreichbar:", coingeckoErr);
        }

        // Versuch 2: Coindesk API für historische Bitcoin-Preise (alternative echte Daten)
        try {
          console.log(`Fetching price history from Coindesk for ${days} days`);
          const coindeskUrl = `https://api.coindesk.com/v1/bpi/historical/close.json?start=${getDateXDaysAgo(
            days
          )}&end=${getFormattedTodayDate()}`;

          const response = await fetch(coindeskUrl);

          if (response.ok) {
            const data = await response.json();
            const bpi = data.bpi;

            if (bpi && Object.keys(bpi).length > 0) {
              // Daten für das Chart aufbereiten
              const chartData = Object.entries(bpi).map(([date, price]) => ({
                date,
                price,
              }));

              setChartData(chartData);
              setUseMockData(false);
              dataSource = "coindesk";
              console.log("Echte Bitcoin-Preisdaten von Coindesk geladen");

              // Erstelle zukunftsprojizierte Daten
              createProjectedData(chartData, endDate);

              setIsLoading(false);
              return;
            }
          }
        } catch (coindeskErr) {
          console.error("Coindesk API nicht erreichbar:", coindeskErr);
        }

        // Versuch 3: Lokale API-Route als Fallback (kann echte oder simulierte Daten verwenden)
        try {
          console.log(
            `Fetching price history from internal API for ${days} days`
          );
          const internalResponse = await fetch(
            `/api/bitcoin/price-history?days=${days}&currentPrice=${validBtcPrice}`
          );
          if (internalResponse.ok) {
            const data = await internalResponse.json();
            if (data && data.prices && data.prices.length > 0) {
              setChartData(data.prices);
              setUseMockData(data.source === "simulated");
              dataSource = data.source || "internal";
              console.log(
                `Bitcoin-Preisdaten von interner API geladen (Quelle: ${dataSource})`
              );

              // Erstelle zukunftsprojizierte Daten
              createProjectedData(data.prices, endDate);

              setIsLoading(false);
              return;
            }
          }
        } catch (internalErr) {
          console.log("Lokale API nicht verfügbar:", internalErr);
        }

        // Letzter Ausweg: Simulierte Testdaten (nur wenn alle anderen Versuche fehlgeschlagen sind)
        console.log(
          `Alle API-Versuche fehlgeschlagen. Verwende simulierte Daten für Bitcoin-Preisverlauf, basePrice: ${validBtcPrice}`
        );
        const mockData = generateMockPriceData(days, validBtcPrice);
        setChartData(mockData);
        setUseMockData(true);
        dataSource = "simulated";

        // Erstelle zukunftsprojizierte Daten
        createProjectedData(mockData, endDate);
      } catch (err) {
        console.error("Fehler beim Laden der Bitcoin-Preisdaten:", err);
        setError("Bitcoin-Preisdaten konnten nicht geladen werden.");
        // Trotzdem Mock-Daten verwenden
        const mockData = generateMockPriceData(90, validBtcPrice);
        setChartData(mockData);
        setUseMockData(true);

        // Erstelle zukunftsprojizierte Daten
        createProjectedData(mockData, endDate);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBitcoinPriceHistory();
  }, [purchaseDuration, interval, validBtcPrice, endDate]);

  // Funktion zum Erstellen von projizierten Daten für die Zukunft
  function createProjectedData(historicalData, targetEndDate) {
    if (!targetEndDate || !historicalData || historicalData.length === 0) {
      setProjectedData([]);
      setYearsInData([]);
      return;
    }

    // Kopiere den letzten historischen Preis
    const lastHistoricalData = historicalData[historicalData.length - 1];
    const lastPrice = lastHistoricalData.price;
    const today = new Date();
    const endDateTime = new Date(targetEndDate);

    // Wenn das Enddatum in der Vergangenheit liegt oder gleich heute ist,
    // keine projizierten Daten nötig
    if (endDateTime <= today) {
      setProjectedData([]);
      return;
    }

    // Berechne die Anzahl der Tage bis zum Enddatum
    const daysDiff = Math.ceil((endDateTime - today) / (1000 * 60 * 60 * 24));

    // Erstelle Datenpunkte von heute bis zum Enddatum
    const projected = [];

    // Füge den letzten historischen Punkt als ersten projizierten Punkt hinzu
    projected.push({
      date: formatDateForAPI(today),
      price: lastPrice,
      isProjected: true,
    });

    // Füge projizierte Punkte für jeden Tag bis zum Enddatum hinzu
    for (let i = 1; i <= daysDiff; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Wir könnten hier auch eine Preisprojektion machen,
      // aber für Einfachheit benutzen wir den letzten bekannten Preis
      // Man könnte auch einen leichten Trend einfügen
      projected.push({
        date: formatDateForAPI(date),
        price: lastPrice,
        isProjected: true,
      });
    }

    setProjectedData(projected);

    // Extrahiere alle Jahre aus historischen und projizierten Daten
    const allData = [...historicalData, ...projected];
    const years = Array.from(
      new Set(allData.map((item) => new Date(item.date).getFullYear()))
    ).sort();

    setYearsInData(years);
  }

  // Berechnet die Anzahl der Tage basierend auf dem Intervall und der Kaufdauer
  function calculateDaysForInterval(duration, interval) {
    switch (interval) {
      case "minutely":
        return Math.min(7, Math.ceil(duration / (24 * 60))); // Max 7 Tage für minütliche Intervalle
      case "hourly":
        return Math.min(30, Math.ceil(duration / 24)); // Max 30 Tage für stündliche Intervalle
      case "daily":
        return Math.min(365, duration); // Max 365 Tage für tägliche Intervalle
      case "weekly":
        return Math.min(365, duration * 7); // Max 365 Tage für wöchentliche Intervalle
      case "monthly":
        return Math.min(730, duration * 30); // Max 730 Tage (2 Jahre) für monatliche Intervalle
      default:
        return 90; // Standardwert: 90 Tage
    }
  }

  // Funktion zum Transformieren der Daten für den DOUBLE_LOG Modus
  useEffect(() => {
    if (chartData.length === 0 && projectedData.length === 0) return;

    // Kombinierte Daten (historisch + projiziert)
    const combined = [...chartData, ...projectedData.slice(1)];

    // Für den DOUBLE_LOG Modus transformieren wir das Datum in einen numerischen Index
    const transformed = combined.map((item, index) => ({
      ...item,
      dateIndex: index + 1, // Indizes beginnend bei 1 (für logarithmische Skala)
      originalDate: item.date, // Das ursprüngliche Datum speichern
    }));

    setTransformedData(transformed);
  }, [chartData, projectedData, chartMode]);

  // Y-Achsen-Transformation basierend auf dem Chart-Modus
  const getYAxisDomain = () => {
    if (chartData.length === 0) return [0, 0];

    const prices = chartData.map((item) => item.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (chartMode === CHART_MODES.NORMAL) {
      // 10% Puffer nach oben und unten
      return [minPrice * 0.9, maxPrice * 1.1];
    } else if (
      chartMode === CHART_MODES.DOUBLE_LOG ||
      chartMode === CHART_MODES.LOG
    ) {
      // Bei logarithmischen Skalen bieten wir einen größeren Bereich an
      // Wir verwenden explizite Werte anstelle von "auto" für bessere Kontrolle
      // Minimum sollte nicht unter 1 sein für logarithmische Skalen
      const safeMinPrice = Math.max(1, minPrice * 0.5);
      return [safeMinPrice, maxPrice * 1.2];
    }

    return ["auto", "auto"]; // Fallback
  };

  // Kombiniere historische und projizierte Daten für die Anzeige
  const combinedData =
    chartMode === CHART_MODES.DOUBLE_LOG
      ? transformedData
      : [...chartData, ...projectedData.slice(1)]; // Überspringe den ersten projizierten Punkt, da er mit dem letzten historischen übereinstimmt

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error && chartData.length === 0) {
    return (
      <div className="alert alert-error">
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
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-xl p-4">
      <h3 className="text-xl font-semibold mb-2">Bitcoin-Preisverlauf</h3>
      <p className="mb-4 text-sm">
        Bei aktuellen Einstellungen ({amount}€ {getIntervalText(interval)}) wird
        Ihr Guthaben am{" "}
        <span className="font-semibold">
          {endDate ? new Date(endDate).toLocaleDateString("de-DE") : "N/A"}
        </span>{" "}
        erschöpft sein.
      </p>

      {useMockData && (
        <div className="alert alert-warning mb-4 py-2">
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
            <strong>Hinweis:</strong> Es werden simulierte Preisdaten angezeigt,
            da keine echten historischen Daten verfügbar sind. Diese Daten
            dienen nur zur Visualisierung und spiegeln nicht den tatsächlichen
            historischen Bitcoin-Preis wider.
          </span>
        </div>
      )}

      <div className="flex justify-center mb-4">
        <div className="btn-group">
          <button
            className={`btn btn-sm ${
              chartMode === CHART_MODES.NORMAL ? "btn-active" : ""
            }`}
            onClick={() => setChartMode(CHART_MODES.NORMAL)}
          >
            Normal
          </button>
          <button
            className={`btn btn-sm ${
              chartMode === CHART_MODES.LOG ? "btn-active" : ""
            }`}
            onClick={() => setChartMode(CHART_MODES.LOG)}
          >
            Log
          </button>
          <button
            className={`btn btn-sm ${
              chartMode === CHART_MODES.DOUBLE_LOG ? "btn-active" : ""
            }`}
            onClick={() => setChartMode(CHART_MODES.DOUBLE_LOG)}
          >
            Doppel-Log
          </button>
        </div>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={combinedData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 25, // Erhöht für die Jahresanzeige
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={
                chartMode === CHART_MODES.DOUBLE_LOG ? "dateIndex" : "date"
              }
              scale={chartMode === CHART_MODES.DOUBLE_LOG ? "log" : "auto"}
              type={
                chartMode === CHART_MODES.DOUBLE_LOG ? "number" : "category"
              }
              domain={
                chartMode === CHART_MODES.DOUBLE_LOG
                  ? ["auto", "auto"]
                  : undefined
              }
              tickFormatter={(tick) => {
                // Stellen Sie sicher, dass das Datum gültig ist
                try {
                  if (chartMode === CHART_MODES.DOUBLE_LOG) {
                    // Im DOUBLE_LOG Modus nutzen wir den Index, um das entsprechende Datum zu finden
                    const item = transformedData.find(
                      (item) => item.dateIndex === tick
                    );
                    if (item) {
                      const date = new Date(item.originalDate);
                      if (isNaN(date.getTime())) return "";
                      return `${date.getDate()}.${date.getMonth() + 1}`;
                    }
                    return "";
                  } else {
                    const date = new Date(tick);
                    if (isNaN(date.getTime())) return "";
                    return `${date.getDate()}.${date.getMonth() + 1}`;
                  }
                } catch (e) {
                  console.warn("Ungültiges Datum oder Index:", tick, e);
                  return "";
                }
              }}
              tick={(props) => {
                try {
                  let displayDate;
                  let year;

                  if (chartMode === CHART_MODES.DOUBLE_LOG) {
                    // Im DOUBLE_LOG Modus den Datumswert aus den transformierten Daten holen
                    const item = transformedData.find(
                      (item) => item.dateIndex === props.payload.value
                    );
                    if (!item) return null;

                    displayDate = new Date(item.originalDate);
                    if (isNaN(displayDate.getTime())) return null;
                    year = displayDate.getFullYear();
                  } else {
                    displayDate = new Date(props.payload.value);
                    if (isNaN(displayDate.getTime())) return null;
                    year = displayDate.getFullYear();
                  }

                  return (
                    <g transform={`translate(${props.x},${props.y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={16}
                        textAnchor="middle"
                        fill={getColorForYear(year)}
                        fontWeight="bold"
                      >
                        {`${displayDate.getDate()}.${
                          displayDate.getMonth() + 1
                        }`}
                      </text>
                    </g>
                  );
                } catch (e) {
                  console.warn("Fehler beim Rendern des X-Achsen-Ticks:", e);
                  return null;
                }
              }}
              ticks={
                chartMode === CHART_MODES.DOUBLE_LOG
                  ? [1, 5, 10, 20, 30, 50, 100, 200, 300, 400, 500].filter(
                      (t) => t <= transformedData.length
                    )
                  : undefined
              }
            />
            <YAxis
              domain={getYAxisDomain()}
              scale={chartMode === CHART_MODES.NORMAL ? "auto" : "log"}
              tickFormatter={(tick) => {
                if (tick === 0) return "0 €";
                return `${Math.round(tick / 1000)}k €`;
              }}
              // Im logarithmischen Modus Anzahl der Ticks reduzieren
              ticks={
                chartMode !== CHART_MODES.NORMAL
                  ? [1000, 5000, 10000, 20000, 50000, 100000]
                  : undefined
              }
            />
            <Tooltip
              formatter={(value, name, props) => {
                // Preis formatieren
                if (name.includes("Bitcoin-Preis")) {
                  return [`${Number(value).toLocaleString("de-DE")} €`, name];
                }
                return [value, name];
              }}
              labelFormatter={(label) => {
                // Datum formatieren
                if (
                  chartMode === CHART_MODES.DOUBLE_LOG &&
                  typeof label === "number"
                ) {
                  // Im DOUBLE_LOG Modus nach dem passenden Eintrag suchen
                  const item = transformedData.find(
                    (item) => item.dateIndex === label
                  );
                  if (item) {
                    return `Datum: ${new Date(
                      item.originalDate
                    ).toLocaleDateString("de-DE")}`;
                  }
                }
                return `Datum: ${new Date(label).toLocaleDateString("de-DE")}`;
              }}
              content={(props) => {
                if (
                  !props.active ||
                  !props.payload ||
                  props.payload.length === 0
                ) {
                  return null;
                }

                let dateDisplay;
                if (chartMode === CHART_MODES.DOUBLE_LOG) {
                  // Finde das Datum basierend auf dem Index
                  const dateIndex = props.payload[0].payload.dateIndex;
                  const item = transformedData.find(
                    (item) => item.dateIndex === dateIndex
                  );
                  dateDisplay = item
                    ? new Date(item.originalDate).toLocaleDateString("de-DE")
                    : "N/A";
                } else {
                  dateDisplay = new Date(
                    props.payload[0].payload.date
                  ).toLocaleDateString("de-DE");
                }

                return (
                  <div className="custom-tooltip bg-white p-2 border rounded shadow-md">
                    <p className="font-semibold">{`Datum: ${dateDisplay}`}</p>
                    {props.payload.map((entry, index) => (
                      <p key={index} style={{ color: entry.color }}>
                        {entry.name}:{" "}
                        {Number(entry.value).toLocaleString("de-DE")} €
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Legend />

            {/* DCA-Kaufzeitraum mit deutlicherem Balken */}
            {endDate && (
              <>
                <defs>
                  <linearGradient id="dcaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="dcaBorder" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2c6e49" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#2c6e49" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <ReferenceArea
                  x1={
                    chartMode === CHART_MODES.DOUBLE_LOG
                      ? transformedData.find(
                          (item) =>
                            item.originalDate === formatDateForAPI(new Date())
                        )?.dateIndex
                      : chartData.length > 0
                      ? chartData[chartData.length - 1].date
                      : formatDateForAPI(new Date())
                  }
                  x2={
                    chartMode === CHART_MODES.DOUBLE_LOG
                      ? transformedData.find(
                          (item) =>
                            item.originalDate ===
                            formatDateForAPI(new Date(endDate))
                        )?.dateIndex
                      : projectedData.length > 0
                      ? projectedData[projectedData.length - 1].date
                      : formatDateForAPI(new Date(endDate))
                  }
                  y1={0}
                  y2={getYAxisDomain()[1]}
                  fill="url(#dcaGradient)"
                  stroke="url(#dcaBorder)"
                  strokeWidth={3}
                  strokeOpacity={1}
                  className="dca-area"
                />
                {/* Label für den DCA-Kaufzeitraum mit Hintergrund */}
                <ReferenceArea
                  x1={
                    chartMode === CHART_MODES.DOUBLE_LOG
                      ? transformedData.find(
                          (item) =>
                            item.originalDate === formatDateForAPI(new Date())
                        )?.dateIndex
                      : chartData.length > 0
                      ? chartData[chartData.length - 1].date
                      : formatDateForAPI(new Date())
                  }
                  x2={
                    chartMode === CHART_MODES.DOUBLE_LOG
                      ? transformedData.find(
                          (item) =>
                            item.originalDate ===
                            formatDateForAPI(new Date(endDate))
                        )?.dateIndex
                      : projectedData.length > 0
                      ? projectedData[projectedData.length - 1].date
                      : formatDateForAPI(new Date(endDate))
                  }
                  y1={getYAxisDomain()[1] * 0.45}
                  y2={getYAxisDomain()[1] * 0.55}
                  fill="rgba(44, 110, 73, 0.2)"
                  stroke="#2c6e49"
                  strokeWidth={1}
                  strokeOpacity={0.8}
                  label={{
                    value: "DCA-Kaufzeitraum",
                    fill: "#2c6e49",
                    fontWeight: "bold",
                    fontSize: 14,
                    position: "center",
                  }}
                />
              </>
            )}

            {/* Markierung für das letzte Kaufdatum */}
            {endDate && projectedData.length > 0 && (
              <ReferenceLine
                x={
                  chartMode === CHART_MODES.DOUBLE_LOG
                    ? transformedData.find(
                        (item) =>
                          item.originalDate ===
                          formatDateForAPI(new Date(endDate))
                      )?.dateIndex
                    : projectedData.length > 0
                    ? projectedData[projectedData.length - 1].date
                    : formatDateForAPI(new Date(endDate))
                }
                y1={0}
                y2={getYAxisDomain()[1] * 0.5}
                stroke="#82ca9d"
                strokeWidth={3}
                label={{
                  position: "right",
                  value: "Letzter Kauf",
                  fill: "#82ca9d",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />
            )}

            {/* Historischer Preisverlauf */}
            <Line
              type="monotone"
              dataKey="price"
              name="Bitcoin-Preis (historisch)"
              stroke="#8884d8"
              strokeWidth={2}
              activeDot={{ r: 8 }}
              dot={false}
              data={
                chartMode === CHART_MODES.DOUBLE_LOG
                  ? transformedData.slice(0, chartData.length)
                  : chartData
              }
            />

            {/* Projizierter Preisverlauf */}
            {projectedData.length > 0 && (
              <Line
                type="monotone"
                dataKey="price"
                name="Bitcoin-Preis (Projektion)"
                stroke="#82ca9d"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                data={
                  chartMode === CHART_MODES.DOUBLE_LOG
                    ? transformedData.slice(chartData.length)
                    : projectedData
                }
              />
            )}

            {/* Referenzlinie für das heutige Datum */}
            <ReferenceLine
              x={
                chartMode === CHART_MODES.DOUBLE_LOG
                  ? transformedData.find(
                      (item) =>
                        item.originalDate === formatDateForAPI(new Date())
                    )?.dateIndex
                  : chartData.length > 0
                  ? chartData[chartData.length - 1].date
                  : formatDateForAPI(new Date())
              }
              stroke="blue"
              strokeWidth={3}
              label={{
                position: "top",
                value: "Heute",
                fill: "blue",
                fontSize: 12,
              }}
            />

            {/* Referenzlinie für das Ende-Datum */}
            {endDate && projectedData.length > 0 && (
              <ReferenceLine
                x={
                  chartMode === CHART_MODES.DOUBLE_LOG
                    ? transformedData.find(
                        (item) =>
                          item.originalDate ===
                          formatDateForAPI(new Date(endDate))
                      )?.dateIndex
                    : projectedData.length > 0
                    ? projectedData[projectedData.length - 1].date
                    : formatDateForAPI(new Date(endDate))
                }
                stroke="red"
                strokeWidth={3}
                strokeDasharray="3 3"
                label={{
                  position: "top",
                  value: "Erschöpft",
                  fill: "red",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              />
            )}

            {/* Jahresmarkierungen für jedes Jahr */}
            {yearsInData.map((year) => {
              const firstDayOfYear = new Date(year, 0, 1);
              // Nur anzeigen, wenn das Jahr nicht in der Zukunft liegt oder wenn es sich um den Projektionsteil handelt
              if (
                firstDayOfYear > new Date() &&
                year !== new Date().getFullYear() + 1
              ) {
                return (
                  <ReferenceLine
                    key={year}
                    x={
                      chartMode === CHART_MODES.DOUBLE_LOG
                        ? transformedData.find(
                            (item) =>
                              item.originalDate ===
                              formatDateForAPI(firstDayOfYear)
                          )?.dateIndex
                        : formatDateForAPI(firstDayOfYear)
                    }
                    stroke={getColorForYear(year)}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                );
              }
              return null;
            })}
          </LineChart>
        </ResponsiveContainer>

        {/* Jahre unter der X-Achse anzeigen */}
        <div className="flex justify-between mt-1 px-10 mb-4">
          {yearsInData.map((year, index) => (
            <div
              key={year}
              className="text-xs font-bold"
              style={{
                color: getColorForYear(year),
                position: "absolute",
                left: `${(index / (yearsInData.length - 1)) * 80 + 10}%`,
                transform: "translateX(-50%)",
                bottom: 0,
              }}
            >
              {year}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <div className="text-xs opacity-70">
          {chartData.length > 0
            ? new Date(chartData[0].date).toLocaleDateString("de-DE")
            : ""}
        </div>
        <div className="text-xs opacity-70">
          {endDate
            ? new Date(endDate).toLocaleDateString("de-DE")
            : chartData.length > 0
            ? new Date(chartData[chartData.length - 1].date).toLocaleDateString(
                "de-DE"
              )
            : ""}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#8884d8]"></div>
          <span className="text-xs">Historischer Preisverlauf</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#82ca9d]"></div>
          <span className="text-xs">Projizierter Preisverlauf</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-12 h-3 bg-[#82ca9d] opacity-20 border border-[#82ca9d]"></div>
          <span className="text-xs">DCA-Kaufzeitraum</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-4 h-0.5 bg-blue-500 h-1"></div>
          <span className="text-xs">Heutiges Datum</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-500 h-1"></div>
          <span className="text-xs">
            Erschöpfungsdatum:{" "}
            {endDate ? new Date(endDate).toLocaleDateString("de-DE") : "N/A"}
          </span>
        </div>

        {/* Jahreslegende */}
        <div className="mt-3 border-t pt-2">
          <span className="text-xs font-semibold">Jahre:</span>
          <div className="flex flex-wrap gap-3 mt-1">
            {yearsInData.map((year) => (
              <div key={year} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getColorForYear(year) }}
                ></div>
                <span className="text-xs">{year}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helfer-Funktion für die textuelle Darstellung des Intervalls
function getIntervalText(interval) {
  switch (interval) {
    case "minutely":
      return "pro Minute";
    case "hourly":
      return "pro Stunde";
    case "daily":
      return "pro Tag";
    case "weekly":
      return "pro Woche";
    case "monthly":
      return "pro Monat";
    default:
      return "";
  }
}
