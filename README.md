# Stundenplan-Server

Dies ist ein einfacher Node.js-Server, der einen Stundenplan von WebUntis abruft und in verschiedenen Formaten zurückgibt. Der Server wurde entwickelt, um auf Anfragen zu reagieren und Stundenplandaten über HTTP bereitzustellen.

## Voraussetzungen

Bevor Sie den Server ausführen können, müssen Sie sicherstellen, dass Node.js auf Ihrem System installiert ist. Außerdem benötigen Sie die folgenden Node.js-Pakete, die in der `package.json`-Datei aufgeführt sind:

- `http`: Das integrierte HTTP-Modul von Node.js.
- `webuntis`: Eine Bibliothek zur Interaktion mit dem WebUntis-System (https://github.com/SchoolUtils/WebUntis). 
- `date-fns`: Eine Bibliothek zur Verarbeitung von Datum und Uhrzeit.
- `date-fns/locale/de`: Ein Datei zur Unterstützung der deutschen Sprache.

## Installation

1. Klonen Sie dieses Repository auf Ihren Computer.
2. Navigieren Sie in das Verzeichnis des Projekts und führen Sie `npm install` aus, um die erforderlichen Abhängigkeiten zu installieren.

## Verwendung

1. Starten Sie den Server mit dem Befehl `npm start`.

2. Der Server läuft standardmäßig auf Port 3000. Sie können die Portnummer in der `server.js`-Datei anpassen.

3. Sie können den Stundenplan abrufen, indem Sie Anfragen an die folgenden Endpunkte senden:

   - `GET /stundenplan/weekly/YYYY-MM-dd`: Abrufen des Wochenstundenplans für das angegebene Datum (ersetzen Sie YYYY-MM-dd durch das gewünschte Datum).
   - `GET /stundenplan/raw/YYYY-MM-dd`: Abrufen des Rohstundenplans für das angegebene Datum.

4. Sie müssen die folgenden Header-Informationen in Ihren Anfragen bereitstellen:

   - `school`: Ihre Schule
   - `username`: Ihr Benutzername
   - `password`: Ihr Passwort
   - `host`: WebUntis Hostname

   Beispiel für eine Anfrage mit cURL:

   ```bash
   curl -X GET "http://localhost:3000/stundenplan/weekly/2023-09-18" -H "school: Ihre_Schule" -H "username: Ihr_Benutzername" -H "password: Ihr_Passwort" -H "host: WebUntis_Hostname"
