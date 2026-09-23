import { loadFirebaseData, showDataError } from "./firebase-data.js";
import { saveDevice } from "./firebase-service.js";

async function initializeDevices() {
    const modal = document.getElementById("deviceModal");
    const form = document.getElementById("deviceForm");
    let data;
    try { data = await loadFirebaseData(); } catch (error) { showDataError(error); return; }
    const { readings } = data;

    async function renderDevices() {
        const { devices: currentDevices } = await loadFirebaseData();
        const devices = currentDevices;
        const body = document.getElementById("deviceTableBody");
        const empty = document.getElementById("deviceEmptyState");
        const count = document.getElementById("deviceCount");
        const activeReadings = document.getElementById("activeReadings");
        document.getElementById("totalDevices").textContent = devices.length;
        document.getElementById("onlineDevices").textContent = devices.filter(device => device.status === "online").length;
        document.getElementById("offlineDevices").textContent = devices.filter(device => device.status !== "online").length;
        activeReadings.textContent = readings.length;
        count.textContent = `${devices.length} Device${devices.length === 1 ? "" : "s"}`;
        empty.style.display = devices.length ? "none" : "block";
        body.innerHTML = devices.map(device => {
            const deviceReadings = readings.filter(reading => reading.deviceId === device.deviceId);
            const latest = deviceReadings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            return `<tr><td><div class="device-name">${escapeHtml(device.deviceName)}</div><div class="device-id">${escapeHtml(device.deviceId)}</div></td><td><span class="status-pill status-${device.status === "online" ? "online" : "offline"}">${device.status}</span></td><td>${deviceReadings.length ? "4" : "0"}</td><td>${latest ? `${latest.value}${latest.unit ? ` ${latest.unit}` : ""}` : "—"}</td><td>${latest ? new Date(latest.timestamp).toLocaleString() : "—"}</td><td><a class="btn-secondary" href="device-details.html?id=${encodeURIComponent(device.deviceId)}">View Details</a></td></tr>`;
        }).join("");
    }

    document.getElementById("openDeviceModal")?.addEventListener("click", () => modal.classList.add("active"));
    document.getElementById("closeDeviceModal").addEventListener("click", () => modal.classList.remove("active"));
    document.getElementById("cancelDevice").addEventListener("click", () => modal.classList.remove("active"));
    form.addEventListener("submit", async event => {
        event.preventDefault();
        const data = new FormData(form);
        await saveDevice({
            deviceName: data.get("deviceName").trim(),
            deviceId: data.get("deviceId").trim(),
            location: data.get("location").trim(),
            status: data.get("status"),
            description: data.get("description").trim()
        });
        form.reset();
        modal.classList.remove("active");
        await renderDevices();
    });

    renderDevices();
}

document.addEventListener("DOMContentLoaded", initializeDevices);

function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

