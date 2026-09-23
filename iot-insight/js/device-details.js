import { loadFirebaseData, showDataError } from "./firebase-data.js";

document.addEventListener("DOMContentLoaded", async () => {
    let data;
    try { data = await loadFirebaseData(); } catch (error) { showDataError(error); return; }
    const { devices, readings } = data;
    const deviceId = new URLSearchParams(window.location.search).get("id") || devices[0]?.deviceId;
    const device = devices.find(item => item.deviceId === deviceId) || devices[0];
    if (!device) return;
    const deviceReadings = readings.filter(reading => reading.deviceId === device.deviceId);
    const states = deviceReadings.filter(reading => reading.state).sort(sortByDate);
    const latest = states[states.length - 1];
    const onCount = states.filter(reading => reading.state === "ON").length;
    const changes = states.slice(1).filter((reading, index) => reading.state !== states[index].state).length;
    setText("deviceDetailName", device.deviceName);
    setText("deviceDetailId", device.deviceId);
    setText("detailDeviceId", device.deviceId);
    setText("detailDeviceLocation", device.location || "Not specified");
    setText("lightState", latest?.state || "Unknown");
    setText("lightValue", latest ? `${latest.parameterName}: ${latest.rawValue ?? latest.value}` : "Waiting for reading...");
    setText("totalReadings", deviceReadings.length);
    setText("onCount", onCount);
    setText("offCount", states.length - onCount);
    setText("onPercentage", `${states.length ? (onCount / states.length * 100).toFixed(1) : 0}%`);
    setText("statusChanges", changes);
    const status = document.getElementById("deviceConnectionStatus");
    if (status) status.textContent = device.status === "online" ? "Online" : "Offline";
    const indicator = document.getElementById("lightIndicator");
    if (indicator && latest?.state === "ON") indicator.classList.add("on");
    if (typeof Chart !== "undefined" && states.length) {
        new Chart(document.getElementById("readingHistoryChart"), { type: "line", data: { labels: states.map(item => formatTime(item.timestamp)), datasets: [{ label: states[0].parameterName, data: states.map(item => item.value), stepped: true, borderColor: "#0f766e" }] }, options: { responsive: true, maintainAspectRatio: false } });
        document.getElementById("readingHistoryEmpty")?.classList.add("hidden");
    }
});

function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }
function sortByDate(a, b) { return new Date(a.timestamp) - new Date(b.timestamp); }
function formatTime(value) { return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }