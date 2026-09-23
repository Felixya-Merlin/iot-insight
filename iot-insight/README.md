# IoT Insight — Phase 1: Manual ThingSpeak CSV Import + Firebase

This phase connects the existing vanilla HTML/CSS/JavaScript UI to Firebase Firestore and adds a manual ThingSpeak CSV import workflow.

## Phase 1 scope

- Vanilla HTML/CSS/JavaScript remains the frontend stack.
- Firebase Firestore is the database.
- Firebase Anonymous Authentication is used so Firestore rules can require an authenticated request.
- ThingSpeak is used only as a public data source for manually downloaded CSV files.
- No ThingSpeak API key is required.
- No automatic ThingSpeak fetching is implemented in this phase.
- No fake sensor data is created.
- Imported data is normalized into `devices`, `parameters`, `readings`, and `imports` collections.

## 1. Create Firebase project

1. Open Firebase Console.
2. Create a project named `iot-insight` (or another name).
3. Add a Web App.
4. Copy the Firebase web configuration.
5. Replace the placeholders in `js/firebase-config.js`.
6. In Authentication -> Sign-in method, enable **Anonymous**.
7. In Firestore Database, create the database.
8. Start with the rules in `firestore.rules.example` and publish them for the college demo.

Do not add a Firebase service-account/private-key JSON file to the frontend repository.

## 2. Collect ThingSpeak data manually

For the first Smart Bulb/LED-state demonstration, use a public channel such as:

https://thingspeak.mathworks.com/channels/1079740

The public channel exposes a field named `Led State`.

From the ThingSpeak channel page:

1. Open the channel.
2. Use the channel's CSV export link.
3. Save the CSV file on your computer.
4. Open `pages/data-import.html` in IoT Insight.
5. Select the CSV.
6. Select the state field.
7. Keep `Power State` as the application parameter name.
8. Preview the rows.
9. Click **Import to Firebase**.

## 3. Data model

### devices/{deviceId}

- deviceId
- deviceName
- location
- source
- sourceChannelId
- sourceUrl
- updatedAt

### parameters/{parameterId}

- parameterId
- deviceId
- parameterName
- unit
- fieldName
- sourceChannelId
- updatedAt

### readings/{autoId}

- deviceId
- parameterId
- parameterName
- timestamp
- entryId
- value
- state
- rawValue
- source
- sourceChannelId
- importedAt

### imports/{autoId}

- deviceId
- parameterId
- source
- sourceChannelId
- sourceUrl
- readingCount
- importedAt

## 4. Local run

Because ES modules and Firebase work more reliably through a local web server, use VS Code Live Server or another static server.

Example:

```text
Open the project folder in VS Code
Right-click index.html
Choose "Open with Live Server"
```

Then open:

```text
pages/data-import.html
```

## Next phases

Phase 2: Read Firebase readings into Dashboard and Chart.js.

Phase 3: Date filtering and Smart Bulb ON/OFF state timeline.

Phase 4: Duration, toggle frequency, state distribution and anomaly insights.

Phase 5: Custom PDF and CSV report generation/download.

Phase 6: Replace manual CSV collection with a controlled server-side ingestion process if required.
