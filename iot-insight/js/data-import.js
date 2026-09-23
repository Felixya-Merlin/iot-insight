import { isFirebaseReady, getFirebaseConnectionStatus, saveImportedDataset } from "./firebase-service.js";

const fileInput = document.getElementById("csvFile");
const fieldSelect = document.getElementById("fieldSelect");
const previewButton = document.getElementById("previewButton");
const importForm = document.getElementById("importForm");
const importButton = document.getElementById("importButton");
const previewArea = document.getElementById("previewArea");
const statusElement = document.getElementById("importStatus");
const firebaseStatus = document.getElementById("firebaseStatus");

let parsedRows = [];
let headers = [];

function setStatus(message, type = "info") {
    statusElement.textContent = message;
    statusElement.className = `import-status show ${type}`;
}

function getImportErrorMessage(error) {
    if (error?.code === "permission-denied" || error?.message?.includes("Missing or insufficient permissions")) {
        return "Firestore permission denied. Publish firestore.rules.example and confirm Anonymous Authentication is enabled.";
    }
    if (error?.code === "auth/admin-restricted-operation") {
        return "Anonymous Authentication is disabled. Enable it in Firebase Authentication > Sign-in method.";
    }
    return error?.message || "Firebase import failed.";
}

async function updateFirebaseStatus() {
    if (!firebaseStatus || !importButton) return;
    const status = await getFirebaseConnectionStatus();
    firebaseStatus.textContent = status;
    firebaseStatus.className = status === "Firebase connected"
        ? "status-badge status-success"
        : "status-badge status-warning";
    importButton.disabled = parsedRows.length === 0;
}

function parseCSVLine(line) {
    const values = [];
    let current = "";
    let quoted = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        const next = line[i + 1];

        if (char === '"' && quoted && next === '"') {
            current += '"';
            i += 1;
        } else if (char === '"') {
            quoted = !quoted;
        } else if (char === "," && !quoted) {
            values.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

function parseCSV(text) {
    const lines = text
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .filter(line => line.trim() !== "");

    if (lines.length < 2) {
        throw new Error("The CSV must contain a header and at least one data row.");
    }

    headers = parseCSVLine(lines[0]);
    const rows = [];

    lines.slice(1).forEach(line => {
        const values = parseCSVLine(line);
        if (!values.some(Boolean)) return;

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ?? "";
        });
        rows.push(row);
    });

    return rows;
}

function detectTimestampField() {
    return headers.find(header =>
        ["created_at", "timestamp", "time", "date"].includes(header.toLowerCase())
    ) || "created_at";
}

function isStateValue(value) {
    const normalized = String(value).trim().toLowerCase();
    return ["on", "off", "true", "false", "1", "0", "high", "low"].includes(normalized);
}

function normalizeValue(rawValue, mode) {
    const text = String(rawValue ?? "").trim();
    const lower = text.toLowerCase();

    if (mode === "number") {
        const numeric = Number(text);
        return Number.isFinite(numeric)
            ? { value: numeric, state: "" }
            : null;
    }

    if (mode === "state" || (mode === "auto" && isStateValue(text))) {
        const on = ["on", "true", "1", "high"].includes(lower);
        return { value: on ? 1 : 0, state: on ? "ON" : "OFF" };
    }

    const numeric = Number(text);
    if (!Number.isFinite(numeric)) return null;
    return { value: numeric, state: "" };
}

function buildNormalizedReadings(rows, selectedField, mode) {
    const timestampField = detectTimestampField();
    const entryField = headers.find(header => header.toLowerCase() === "entry_id");
    const dataFields = headers.filter(header => header !== timestampField && header.toLowerCase() !== "entry_id");
    return rows.flatMap(row => {
        const timestamp = new Date(row[timestampField]);
        if (Number.isNaN(timestamp.getTime())) return [];
        return dataFields.map(field => {
            const normalized = normalizeValue(row[field], field === selectedField ? mode : "auto");
            if (!normalized && !String(row[field] ?? "").trim()) return null;
            return { parameterName: field, timestamp: timestamp.toISOString(), entryId: entryField ? row[entryField] : "", rawValue: row[field], value: normalized?.value ?? 0, state: normalized?.state || String(row[field] ?? "") };
        }).filter(Boolean);
    });
}

function renderPreview(rows, selectedField) {
    const previewRows = rows.slice(0, 20);
    const columns = headers;

    previewArea.innerHTML = `
        <table class="preview-table">
            <thead><tr>${columns.map(column => `<th>${column}</th>`).join("")}</tr></thead>
            <tbody>
                ${previewRows.map(row => `
                    <tr>${columns.map(column => `<td>${escapeHtml(row[column] ?? "")}</td>`).join("")}</tr>
                `).join("")}
            </tbody>
        </table>
            <p class="muted" style="margin-top:10px">Showing ${previewRows.length} of ${rows.length} parsed rows across ${columns.length} detected fields. Primary field: ${escapeHtml(selectedField)}</p>
    `;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    if (localStorage.getItem("iot-insight-active-import") && !window.confirm("Importing this file will replace the active dataset for this workspace. Continue?")) {
        fileInput.value = "";
        return;
    }
    localStorage.removeItem("iot-insight-active-import");

    try {
        const text = await file.text();
        parsedRows = parseCSV(text);

        fieldSelect.innerHTML = `<option value="__all__">All parameters</option>${headers
            .filter(header => !["created_at", "entry_id"].includes(header.toLowerCase()))
            .map(header => `<option value="${escapeHtml(header)}">${escapeHtml(header)}</option>`)
            .join("")}`;

        if (!fieldSelect.options.length) {
            throw new Error("No data fields were found in the CSV.");
        }

        renderPreview(parsedRows, fieldSelect.value);
        setStatus(`${parsedRows.length} CSV rows parsed successfully. Review the field mapping before importing.`, "success");
        updateFirebaseStatus();
    } catch (error) {
        parsedRows = [];
        fieldSelect.innerHTML = `<option value="">Upload a valid CSV</option>`;
        setStatus(error.message, "error");
        updateFirebaseStatus();
    }
});

fieldSelect.addEventListener("change", () => {
    if (parsedRows.length) renderPreview(parsedRows, fieldSelect.value);
});

previewButton.addEventListener("click", () => {
    if (!parsedRows.length) {
        setStatus("Choose a CSV file first.", "error");
        return;
    }
    renderPreview(parsedRows, fieldSelect.value);
    setStatus("Preview updated. No data has been written to Firebase.", "info");
});

importForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!isFirebaseReady()) {
        setStatus("Configure Firebase before importing data.", "error");
        return;
    }

    const selectedField = fieldSelect.value === "__all__" ? headers.find(header => !["created_at", "entry_id"].includes(header.toLowerCase())) : fieldSelect.value;
    const mode = document.getElementById("valueMode").value;
    const readings = buildNormalizedReadings(parsedRows, selectedField, mode);

    if (!readings.length) {
        setStatus("No valid timestamp/value rows could be normalized from the selected field.", "error");
        return;
    }

    importButton.disabled = true;
    importButton.textContent = "Importing...";

    try {
        const result = await saveImportedDataset({
            deviceId: document.getElementById("deviceId").value.trim() || "imported-dataset",
            deviceName: document.getElementById("deviceName").value.trim() || "Imported sensor dataset",
            location: document.getElementById("location").value.trim(),
            parameterName: document.getElementById("parameterName").value.trim() || selectedField,
            unit: document.getElementById("unit").value.trim(),
            fieldName: selectedField,
            sourceChannelId: document.getElementById("channelId").value.trim(),
            sourceUrl: document.getElementById("sourceUrl").value.trim(),
            readings
        });

        setStatus(`Import complete. ${result.importedCount} readings were saved to Firebase for ${result.deviceId}.`, "success");
    } catch (error) {
        console.error(error);
        setStatus(getImportErrorMessage(error), "error");
    } finally {
        updateFirebaseStatus();
        importButton.textContent = "Import to Firebase";
    }
});

try {
    updateFirebaseStatus();
} catch (error) {
    console.error(error);
    firebaseStatus.textContent = "Connection error";
    firebaseStatus.className = "status-badge status-warning";
    setStatus("Firebase could not be initialized. Check the Firebase Web App configuration and use a local web server.", "error");
}
