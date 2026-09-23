import { loadFirebaseData, showDataError } from "./firebase-data.js";

document.addEventListener("DOMContentLoaded", async () => {
    let data;
    try { data = await loadFirebaseData(); } catch (error) { showDataError(error); return; }
    const { readings, devices } = data;
    const field = readings.find(reading => Number.isFinite(Number(reading.value)))?.parameterName || readings[0]?.parameterName;
    const stateReadings = readings.filter(reading => reading.parameterName === field).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const powerReadings = stateReadings;
    if (!stateReadings.length) return;

    const latest = stateReadings[stateReadings.length - 1];
    const onCount = stateReadings.filter(reading => reading.state === "ON").length;
    const switchCount = stateReadings.slice(1).filter((reading, index) => reading.state !== stateReadings[index].state).length;
    const energyKwh = powerReadings.reduce((total, reading) => total + Number(reading.value || 0), 0) / 1000;
    const stats = document.querySelectorAll(".dashboard-stat");

    updateStat(stats[0], String(devices.length), "Firebase devices");
    updateStat(stats[1], String(new Set(readings.map(reading => reading.parameterName)).size), "Imported parameters");
    updateStat(stats[2], String(readings.length), "Last 24 hours");
    updateStat(stats[3], "0", "No active alerts");
    setText("currentLightState", latest.state);
    setText("lightStatus", latest.state);
    setText("lightValue", `${field}: ${latest.rawValue ?? latest.value}`);
    setText("latestReading", `${field} at ${formatTime(latest.timestamp)}`);
    setText("lastUpdated", formatTime(latest.timestamp));
    setText("statusUpdated", formatTime(latest.timestamp));

    const dashboardFieldSelect = document.getElementById("dashboardFieldSelect");
    const fields = [...new Set(readings.map(reading => reading.parameterName))];
    if (dashboardFieldSelect) {
        dashboardFieldSelect.innerHTML = `<option value="">All parameters</option>${fields.map(fieldName => `<option value="${escapeHtml(fieldName)}">${escapeHtml(fieldName)}</option>`).join("")}`;
        dashboardFieldSelect.addEventListener("change", () => renderParameterChart(readings, dashboardFieldSelect.value));
    }
    renderParameterChart(readings, "");
});

let parameterChart;

function renderParameterChart(readings, selectedField) {
    const canvas = document.getElementById("lightTrendChart");
    if (!canvas || typeof Chart === "undefined") return;

    parameterChart?.destroy();
    const fields = selectedField ? [selectedField] : [...new Set(readings.map(reading => reading.parameterName).filter(Boolean))];
    const numericFields = fields.filter(name => readings.some(reading => reading.parameterName === name && Number.isFinite(Number(reading.value))));
    const pointsByField = numericFields.map(name => {
        const points = readings
            .filter(reading => reading.parameterName === name && Number.isFinite(Number(reading.value)) && reading.timestamp)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return { name, points };
    }).filter(series => series.points.length);

    if (!pointsByField.length) {
        showChartEmptyState("chartEmpty", "lightTrendChart", false);
        return;
    }

    const labels = [...new Set(pointsByField.flatMap(series => series.points.map(point => point.timestamp)))]
        .sort((a, b) => new Date(a) - new Date(b));
    const colors = ["#27705e", "#2563eb", "#d97706", "#b42318", "#7c3aed", "#0891b2"];
    parameterChart = new Chart(canvas, {
        type: "line",
        data: {
            labels: labels.map(timestamp => new Date(timestamp).toLocaleString()),
            datasets: pointsByField.map((series, index) => ({
                label: series.name,
                data: labels.map(timestamp => {
                    const point = series.points.find(item => item.timestamp === timestamp);
                    return point ? Number(point.value) : null;
                }),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length],
                tension: 0.25,
                spanGaps: true,
                pointRadius: 2
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: { legend: { display: true, position: "bottom" } },
            scales: { x: { ticks: { autoSkip: true, maxTicksLimit: 12, maxRotation: 45 } } }
        }
    });
    showChartEmptyState("chartEmpty", "lightTrendChart", true);
}

function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function updateStat(card, value, message) {
    if (!card) return;
    card.querySelector(".stat-value").textContent = value;
    card.querySelector(".stat-change").textContent = message;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function formatTime(value) {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}