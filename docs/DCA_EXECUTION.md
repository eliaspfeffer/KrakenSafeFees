# DCA-Ausführungsprozess

Diese Dokumentation beschreibt den automatisierten Dollar-Cost-Averaging (DCA) Ausführungsprozess für die Krakensafefees-Plattform.

## Übersicht

Der DCA-Ausführungsprozess ist ein automatisiertes System, das regelmäßig Bitcoin-Käufe für Benutzer durchführt, basierend auf ihren konfigurierten DCA-Einstellungen. Das System nutzt Vercel Cron Jobs, um alle 10 Minuten zu prüfen, ob Käufe durchgeführt werden müssen.

## Komponenten

Der DCA-Ausführungsprozess besteht aus folgenden Komponenten:

1. **Vercel Cron Job**: Konfiguriert in `vercel.json`, ruft alle 10 Minuten die API-Route auf.
2. **API-Route**: `app/api/cron/execute-dca-orders/route.js` sucht nach fälligen DCA-Aufträgen und führt sie aus.
3. **Bitcoin-Kauf-Funktion**: `buyBitcoin()` in `lib/krakenApi.js` führt den eigentlichen Kauf über die Kraken API durch.
4. **Transaktion-Model**: Speichert die Ergebnisse der DCA-Ausführungen in der MongoDB.

## Funktionsweise

1. Der Vercel Cron Job ruft alle 10 Minuten die `/api/cron/execute-dca-orders` Route auf.
2. Die API-Route prüft den Authorisierungs-Header und sucht nach Benutzern mit fälligen DCA-Aufträgen.
3. Für jeden gefundenen Benutzer:
   - Der Status wird auf "processing" gesetzt, um Race Conditions zu vermeiden.
   - Die API-Keys werden entschlüsselt.
   - Der Bitcoin-Kauf wird über die Kraken API durchgeführt.
   - Eine Transaktion wird in der Datenbank gespeichert.
   - Das nächste Ausführungsdatum wird berechnet und der Status aktualisiert.

## Sicherheit

- **API-Authentifizierung**: Der Cron-Job ist durch einen API-Key (`CRON_SECRET`) geschützt.
- **API-Key-Verschlüsselung**: Die Kraken API-Keys werden verschlüsselt in der Datenbank gespeichert.
- **Race Condition Vermeidung**: Der Status wird während der Verarbeitung auf "processing" gesetzt.
- **Fehlerbehandlung**: Jeder Auftrag wird einzeln verarbeitet, Fehler bei einem Benutzer beeinflussen nicht andere.
- **Timeouts**: Die Kraken API-Aufrufe haben einen Timeout, um hängende Anfragen zu verhindern.

## Datenmodell

### User-Model (MongoDB Collection "users")

```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String",
  "dcaSettings": {
    "interval": "String (daily, weekly, monthly)",
    "amount": "Number",
    "nextExecutionDate": "Date",
    "status": "String (scheduled, processing, completed, failed)",
    "updatedAt": "Date"
  },
  "krakenApiKeys": {
    "public": "String",
    "secret": "String (encrypted)",
    "createdAt": "Date"
  }
}
```

### Transaction-Model

```json
{
  "userId": "ObjectId",
  "btcAmount": "Number",
  "eurAmount": "Number",
  "btcPrice": "Number",
  "actualFee": "Number",
  "standardFee": "Number",
  "status": "String (pending, completed, failed)",
  "notes": "String",
  "krakenTxId": "String"
}
```

## Konfiguration

### Umgebungsvariablen

- `CRON_SECRET`: Geheimer Schlüssel für die Authentifizierung des Cron-Jobs
- `ENCRYPTION_KEY`: Schlüssel für die Verschlüsselung der API-Keys

### Vercel.json

```json
{
  "version": 2,
  "crons": [
    {
      "path": "/api/cron/execute-dca-orders",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

## Testen

Für Testzwecke im Entwicklungsmodus kann der DCA-Ausführungsprozess manuell über die Route `/api/user/execute-dca-test` ausgelöst werden. Diese Route ist nur im Entwicklungsmodus verfügbar und erfordert eine Benutzer-Authentifizierung.

## Fehlerbehandlung

- Bei einem Fehler während der Transaktion wird eine Fehlertransaktion in der Datenbank gespeichert.
- Der DCA-Status wird auf "scheduled" zurückgesetzt.
- Fehler werden im Server-Log protokolliert.
- Der nächste Versuch erfolgt beim nächsten geplanten Ausführungsdatum.
