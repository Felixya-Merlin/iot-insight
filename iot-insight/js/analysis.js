import { loadFirebaseData, showDataError } from "./firebase-data.js";

let readings = [];
let fields = [];
let charts = [];

document.addEventListener("DOMContentLoaded", async () => {
    try { ({ readings } = await loadFirebaseData()); } catch (error) { showDataError(error); return; }
    fields = [...new Set(readings.map(item => item.parameterName).filter(Boolean))];
    const selector = document.getElementById("analysisFieldSelect");
    const compareSelector = document.getElementById("analysisCompareField");
    if (!selector || !fields.length) return;

    selector.innerHTML = fields.map(field => option(field)).join("");
    compareSelector.innerHTML = `<option value="">Select comparison field</option>${fields.map(field => option(field)).join("")}`;
    const render = () => renderAnalysis(selector.value, compareSelector?.value || "");
    selector.addEventListener("change", render);
    compareSelector?.addEventListener("change", render);
    document.querySelectorAll(".filter-tab").forEach(button => button.addEventListener("click", () => {
        document.querySelectorAll(".filter-tab").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        render();
    }));
    render();
});

function renderAnalysis(field, compareField) {
    const selectedItems = filterByRange(readings.filter(item => item.parameterName === field));
    const items = selectedItems.filter(item => Number.isFinite(Number(item.value))).sort(sortByTime);
    const values = items.map(item => Number(item.value));
    updateSummary(field, values);

    const host = document.getElementById("analysisAllFields");
    if (!host) return;
    charts.forEach(chart => chart.destroy());
    charts = [];
    host.replaceChildren();
    if (!selectedItems.length) {
        host.innerHTML = `<div class="empty-state">No readings are available for ${escapeHtml(field)} in this period.</div>`;
        return;
    }

    const numericItems = items.length ? items : selectedItems;
    if (items.length) {
        addChart(host, `${field} · line`, "line", items.map(labelTime), values, field);
        addChart(host, `${field} · area`, "line", items.map(labelTime), values, field, { fill: true });
        const histogram = createHistogram(values);
        addChart(host, `${field} · histogram`, "bar", histogram.labels, histogram.data, "Reading count", { beginAtZero: true });
        const frequency = createFrequencyDistribution(values);
        addChart(host, `${field} · frequency`, "bar", frequency.labels, frequency.data, "Frequency", { beginAtZero: true });
        addGauge(host, field, values[values.length - 1], Math.min(...values), Math.max(...values));
        addHeatmap(host, field, items);
    }

    addDistributionChart(host, field, selectedItems);
    addCategoryComparison(host, field, selectedItems);
    addScatterChart(host, field, compareField, items);
    addDataTable(host, field, selectedItems);
    addLocationCard(host);
}

function updateSummary(field, values) {
    const numeric = values.length > 0;
    if (numeric) {
        const minimum = Math.min(...values);
        const maximum = Math.max(...values);
        const average = values.reduce((sum, value) => sum + value, 0) / values.length;
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
        document.querySelectorAll(".summary-card strong").forEach((element, index) => {
            element.textContent = [minimum, maximum, average, median, deviation][index].toFixed(2);
        });
        const change = values.length > 1 ? values[values.length - 1] - values[0] : 0;
        document.querySelectorAll(".analysis-value").forEach((element, index) => {
            element.textContent = [change > 0 ? "Rising" : change < 0 ? "Falling" : "Stable", change.toFixed(2), average.toFixed(2)][index];
        });
    } else {
        document.querySelectorAll(".summary-card strong").forEach(element => { element.textContent = "—"; });
        document.querySelectorAll(".analysis-value").forEach(element => { element.textContent = "—"; });
    }
    document.querySelectorAll(".empty-state").forEach((element, index) => {
        if (index === 0 && numeric) element.innerHTML = `<h3>${escapeHtml(field)} range</h3><p>Numeric analysis is based on ${values.length} readings.</p>`;
        if (index === 1 && numeric) element.innerHTML = `<h3>Dynamic analysis</h3><p>Charts below are selected according to the available reading types.</p>`;
    });
}

function addChart(host, title, type, labels, data, label, options = {}) {
    const card = createCard(host, title);
    const color = "#27705e";
    const chart = new Chart(card.querySelector("canvas"), {
        type,
        data: { labels, datasets: [{ label, data, borderColor: color, backgroundColor: type === "bar" ? "rgba(39,112,94,.7)" : "rgba(39,112,94,.15)", fill: Boolean(options.fill), tension: 0.25, spanGaps: true }] },
        options: chartOptions(label, options)
    });
    charts.push(chart);
}

function addDistributionChart(host, field, items) {
    const counts = countBy(items, item => item.state || item.rawValue || item.value);
    const entries = [...counts.entries()];
    if (entries.length < 2) return;
    const card = createCard(host, `${field} · ON/OFF or proportional distribution`);
    charts.push(new Chart(card.querySelector("canvas"), {
        type: "doughnut",
        data: { labels: entries.map(([label]) => String(label)), datasets: [{ label: "Readings", data: entries.map(([, count]) => count), backgroundColor: ["#27705e", "#2563eb", "#d97706", "#b42318", "#7c3aed"] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }
    }));
}

function addCategoryComparison(host, field, items) {
    const key = new Set(items.map(item => item.deviceId).filter(Boolean)).size > 1 ? item => item.deviceId : item => item.state || item.rawValue;
    const counts = countBy(items, key);
    if (counts.size < 2) return;
    addChart(host, `${field} · category/device comparison`, "bar", [...counts.keys()].map(String), [...counts.values()], "Reading count", { beginAtZero: true });
}

function addScatterChart(host, field, compareField, primaryItems) {
    if (!compareField || compareField === field) return;
    const secondary = filterByRange(readings.filter(item => item.parameterName === compareField))
        .filter(item => Number.isFinite(Number(item.value)));
    const byTimestamp = new Map(secondary.map(item => [String(item.timestamp), Number(item.value)]));
    const points = primaryItems
        .filter(item => byTimestamp.has(String(item.timestamp)))
        .map(item => ({ x: Number(item.value), y: byTimestamp.get(String(item.timestamp)) }));
    if (points.length < 2) return;
    const card = createCard(host, `${field} vs ${compareField} · scatter`);
    charts.push(new Chart(card.querySelector("canvas"), {
        type: "scatter",
        data: { datasets: [{ label: `${field} vs ${compareField}`, data: points, backgroundColor: "#2563eb", pointRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: field } }, y: { title: { display: true, text: compareField } } } }
    }));
}

function addGauge(host, field, current, minimum, maximum) {
    const range = maximum - minimum || Math.abs(current) || 1;
    const progress = Math.max(0, Math.min(100, ((current - minimum) / range) * 100));
    const card = createCard(host, `${field} · current value gauge`);
    charts.push(new Chart(card.querySelector("canvas"), {
        type: "doughnut",
        data: { labels: ["Current", "Remaining"], datasets: [{ data: [progress, 100 - progress], backgroundColor: ["#27705e", "#e5edf7"], borderWidth: 0 }] },
        options: { rotation: -90, circumference: 180, cutout: "70%", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: `${current.toFixed(2)} (range ${minimum.toFixed(2)} - ${maximum.toFixed(2)})` } } }
    }));
}

function addHeatmap(host, field, items) {
    const buckets = new Map();
    items.forEach(item => {
        const date = new Date(item.timestamp);
        const key = `${date.toLocaleDateString()} ${String(date.getHours()).padStart(2, "0")}:00`;
        buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    if (!buckets.size) return;
    addChart(host, `${field} · activity by hour/day`, "bar", [...buckets.keys()], [...buckets.values()], "Activity", { beginAtZero: true });
}

function addDataTable(host, field, items) {
    const card = document.createElement("section");
    card.className = "chart-card analysis-data-table";
    card.innerHTML = `<h4>${escapeHtml(field)} · exact readings</h4><div class="table-wrapper"><table><thead><tr><th>Time</th><th>Value</th><th>State</th><th>Device</th></tr></thead><tbody>${items.slice().sort(sortByTime).reverse().slice(0, 100).map(item => `<tr><td>${escapeHtml(labelTime(item))}</td><td>${escapeHtml(item.rawValue ?? item.value)}</td><td>${escapeHtml(item.state || "—")}</td><td>${escapeHtml(item.deviceId || "—")}</td></tr>`).join("")}</tbody></table></div>`;
    host.append(card);
}

function addLocationCard(host) {
    const latitude = fields.find(field => /^(lat|latitude|gps_lat)/i.test(field));
    const longitude = fields.find(field => /^(lon|lng|longitude|gps_lon)/i.test(field));
    if (!latitude || !longitude) return;
    const latestLat = latestValue(latitude);
    const latestLon = latestValue(longitude);
    if (!Number.isFinite(latestLat) || !Number.isFinite(latestLon)) return;
    const card = document.createElement("section");
    card.className = "chart-card";
    card.innerHTML = `<h4>GPS location map</h4><p>Latest position: ${latestLat.toFixed(5)}, ${latestLon.toFixed(5)}</p><a href="https://www.openstreetmap.org/?mlat=${latestLat}&mlon=${latestLon}#map=15/${latestLat}/${latestLon}" target="_blank" rel="noopener">Open location map</a>`;
    host.append(card);
}

function createHistogram(values) {
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    if (minimum === maximum) return { labels: [minimum.toFixed(2)], data: [values.length] };
    const binCount = Math.min(10, Math.max(5, Math.ceil(Math.sqrt(values.length))));
    const binSize = (maximum - minimum) / binCount;
    const counts = Array(binCount).fill(0);
    values.forEach(value => { counts[Math.min(binCount - 1, Math.floor((value - minimum) / binSize))] += 1; });
    return { labels: counts.map((_, index) => `${(minimum + index * binSize).toFixed(2)} - ${(minimum + (index + 1) * binSize).toFixed(2)}`), data: counts };
}

function createFrequencyDistribution(values) {
    const counts = new Map();
    values.forEach(value => { const key = value.toFixed(2); counts.set(key, (counts.get(key) || 0) + 1); });
    const entries = [...counts.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
    return { labels: entries.map(([value]) => value), data: entries.map(([, count]) => count) };
}

function chartOptions(yTitle, options) {
    return { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: "bottom" } }, scales: { x: { ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 12 } }, y: { beginAtZero: Boolean(options.beginAtZero), title: { display: true, text: yTitle } } } };
}

function createCard(host, title) {
    const card = document.createElement("section");
    card.className = "chart-card";
    card.innerHTML = `<h4>${escapeHtml(title)}</h4><canvas></canvas>`;
    host.append(card);
    return card;
}

function countBy(items, getKey) {
    const counts = new Map();
    items.forEach(item => { const key = String(getKey(item) ?? "Unknown"); counts.set(key, (counts.get(key) || 0) + 1); });
    return counts;
}

function latestValue(field) {
    const item = readings.filter(reading => reading.parameterName === field && Number.isFinite(Number(reading.value))).sort(sortByTime).pop();
    return item ? Number(item.value) : NaN;
}

function filterByRange(items) {
    const range = document.querySelector(".filter-tab.active")?.dataset.range;
    if (!range || range === "custom") return items;
    const now = Date.now();
    if (range === "today") {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return items.filter(item => new Date(item.timestamp).getTime() >= startOfDay.getTime());
    }
    const duration = { "24hours": 24 * 60 * 60 * 1000, "7days": 7 * 24 * 60 * 60 * 1000, "30days": 30 * 24 * 60 * 60 * 1000 }[range];
    return duration ? items.filter(item => now - new Date(item.timestamp).getTime() <= duration) : items;
}

function sortByTime(a, b) { return new Date(a.timestamp) - new Date(b.timestamp); }
function labelTime(item) { return new Date(item.timestamp).toLocaleString(); }
function option(value) { return `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`; }
function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
