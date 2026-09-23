import { loadFirebaseData, showDataError } from "./firebase-data.js";

document.addEventListener("DOMContentLoaded", async () => {
    let data;
    try { data = await loadFirebaseData(); } catch (error) { showDataError(error); return; }
    const { parameters, readings, devices } = data;
    const body = document.getElementById("parameterTableBody");
    const empty = document.getElementById("parameterEmptyState");
    document.getElementById("parameterCount").textContent = `${parameters.length} Parameter${parameters.length === 1 ? "" : "s"}`;
    empty.style.display = parameters.length ? "none" : "block";
    body.innerHTML = parameters.map(parameter => {
        const values = readings.filter(reading => reading.parameterName === parameter.parameterName).map(reading => Number(reading.value)).filter(Number.isFinite);
        const device = devices.find(item => item.deviceId === parameter.deviceId);
        return `<tr><td>${escapeHtml(parameter.parameterName)}</td><td>${escapeHtml(parameter.unit || "Detected")}</td><td>${escapeHtml(device?.deviceName || parameter.deviceId)}</td><td>${values.length ? Math.min(...values).toFixed(2) : "Categorical"}</td><td>${values.length ? Math.max(...values).toFixed(2) : "Categorical"}</td><td>Active import</td><td>Firebase</td></tr>`;
    }).join("");
});

function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
