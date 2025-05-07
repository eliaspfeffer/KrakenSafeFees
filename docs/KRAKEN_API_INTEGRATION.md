# Kraken API Integration

Diese Dokumentation beschreibt die Integration der Kraken API in das Krakensafefees-Projekt, mit der Nutzer ihre Bitcoin- und Euro-Guthaben auf Kraken abfragen können.

## Überblick

Die Integration ermöglicht es angemeldeten Nutzern, nach Hinterlegung ihrer Kraken API-Keys, ihren aktuellen Kontostand auf dem Dashboard anzuzeigen. Dies umfasst:

- Euro-Guthaben
- Bitcoin-Guthaben (in BTC und EUR)
- Aktueller Bitcoin-Kurs
- Gesamtwert des Portfolios

Die Integration verwendet die offizielle Kraken REST API und folgt deren Authentifizierungsschema mit API-Keys und Signaturen.

## Architektur

Die Integration basiert auf einer dreistufigen Architektur:

1. **Frontend**: React-Komponente `KrakenBalance`, die den Kontostand im Dashboard anzeigt
2. **API-Route**: Next.js API-Route, die die Anfragen zur Kraken API weiterleitet
3. **Kraken API Helpers**: Helper-Funktionen, die die Kommunikation mit der Kraken API übernehmen

## Wichtige Dateien

### Frontend

- `/components/KrakenBalance.js`: React-Komponente zur Anzeige des Kontostands

### Backend

- `/app/api/user/kraken-balance/route.js`: Next.js API-Route zum Abrufen des Kontostands
- `/lib/krakenApi.js`: Helper-Funktionen für die Kommunikation mit der Kraken API
- `/lib/encryption.js`: Ver- und Entschlüsselung der API-Keys

## Kraken API Authentifizierung

Die Integration verwendet das von Kraken vorgeschriebene Signaturverfahren:

1. Erstellung einer Nonce (Timestamp)
2. Erstellung eines SHA-256 Hashes des Nonce + URL-kodierter Anfrageparameter
3. Erstellung einer HMAC-SHA-512 Signatur mit dem API-Secret
4. Base64-Kodierung der Signatur

Die implementierte Funktion `getKrakenSignature()` in `/lib/krakenApi.js` entspricht genau der Referenzimplementierung von Kraken.

## Sicherheitsaspekte

- Die API-Keys werden verschlüsselt in der Datenbank gespeichert
- Die Entschlüsselung erfolgt nur serverseitig für API-Anfragen
- Die Integration verwendet nur API-Keys mit eingeschränkten Berechtigungen (Query funds)
- Es werden keine Auszahlungsberechtigungen benötigt oder verwendet

## Fallback-Modus für Entwicklung

Für die Entwicklung oder bei fehlerhaften API-Keys gibt es einen Fallback-Modus, der Test-Daten zurückgibt:

- Der Modus wird automatisch aktiviert, wenn der API-Aufruf fehlschlägt und `NODE_ENV === "development"` ist
- Die Frontend-Komponente zeigt einen Hinweis an, wenn Testdaten verwendet werden
- Der tatsächliche Bitcoin-Preis wird weiterhin von der öffentlichen Kraken API abgerufen

## Mögliche Fehler und Lösungen

### Ungültige API-Keys

- Überprüfen Sie, ob die API-Keys korrekt erstellt wurden
- Stellen Sie sicher, dass die Keys die Berechtigung "Query funds" haben
- Warten Sie einige Minuten nach der Erstellung von neuen Keys, bis sie aktiv sind

### Ungültige Signatur

- Überprüfen Sie, ob der Secret Key korrekt ist
- Prüfen Sie die Verschlüsselungs-/Entschlüsselungsfunktion

### Rate Limiting

- Begrenzen Sie die Anzahl der Anfragen an die Kraken API
- Implementieren Sie ein Caching für die Antworten

## Nutzung der API-Integration

Um die Kraken API-Integration als Nutzer zu verwenden:

1. Melden Sie sich auf dem Dashboard an
2. Klicken Sie auf "Kraken API Keys einrichten"
3. Erstellen Sie API-Keys auf Kraken mit "Query funds" Berechtigung
4. Tragen Sie die Keys im Dashboard ein
5. Die Balance wird automatisch angezeigt und kann über die "Aktualisieren"-Schaltfläche neu geladen werden

## Entwicklungshinweise

### Anpassen der Integration

1. Die Hauptlogik befindet sich in `/lib/krakenApi.js`
2. Die API-Route ist unter `/app/api/user/kraken-balance/route.js` definiert
3. Die Frontend-Komponente ist `/components/KrakenBalance.js`

### Hinzufügen weiterer Kraken API-Funktionen

1. Erstellen Sie eine neue Funktion in `/lib/krakenApi.js`
2. Implementieren Sie eine neue API-Route unter `/app/api/user/`
3. Erstellen Sie eine neue Frontend-Komponente oder erweitern Sie bestehende

### Debugging

- Nutzen Sie die Konsole des Browsers und des Servers für Fehlermeldungen
- Überprüfen Sie die Netzwerk-Anfragen im Browser-Developer-Tool
- Aktivieren Sie den Fallback-Modus für die Entwicklung
