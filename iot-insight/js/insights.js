import { loadFirebaseData, showDataError } from "./firebase-data.js";

document.addEventListener("DOMContentLoaded", async () => {
    let data;
    try { data = await loadFirebaseData(); } catch (error) { showDataError(error); return; }
    const host = document.getElementById("insightsList");
    const readings = data.readings;
    const fields = [...new Set(readings.map(reading => reading.parameterName))];
    const insights = fields.map(field => {
        const values = readings.filter(reading => reading.parameterName === field).map(reading => Number(reading.value)).filter(Number.isFinite);
        if (!values.length) return { text: `${field} contains categorical observations across ${readings.filter(reading => reading.parameterName === field).length} records.` };
        const minimum = Math.min(...values); const maximum = Math.max(...values); const average = values.reduce((sum, value) => sum + value, 0) / values.length;
        return { text: `${field} ranged from ${minimum.toFixed(2)} to ${maximum.toFixed(2)}, with an average of ${average.toFixed(2)} across ${values.length} readings.` };
    });
    if (!insights.length) { host.innerHTML = `<div class="empty-state">Import a dataset to generate insights.</div>`; return; }
    const chartValues = fields.map(field => {
        const values = readings.filter(reading => reading.parameterName === field).map(reading => Number(reading.value)).filter(Number.isFinite);
        return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    });
    const graphHost = document.getElementById("insightGraphs");
    if (graphHost && typeof Chart !== "undefined") fields.forEach((field, index) => {
        const items = readings.filter(reading => reading.parameterName === field && Number.isFinite(Number(reading.value)));
        if (!items.length) return;
        const card = document.createElement("section"); card.className = "chart-card"; card.innerHTML = `<h4>${field}</h4><canvas id="insight-chart-${index}"></canvas>`; graphHost.append(card);
        new Chart(document.getElementById(`insight-chart-${index}`), { type: "line", data: { labels: items.map(item => new Date(item.timestamp).toLocaleString()), datasets: [{ label: field, data: items.map(item => Number(item.value)), borderColor: "#27705e", backgroundColor: "rgba(39,112,94,.15)", fill: true }] }, options: { responsive: true, maintainAspectRatio: false } });
    });
    host.innerHTML = insights.map((insight, index) => `<article class="insight-item" data-index="${index}"><p contenteditable="true">${insight.text}</p><div class="form-actions"><button type="button" data-flag>Flag</button><button type="button" data-report>Add to report</button><button type="button" data-dismiss>Dismiss</button></div></article>`).join("");
    host.addEventListener("click", event => {
        const item = event.target.closest(".insight-item");
        if (!item) return;
        if (event.target.matches("[data-dismiss]")) item.remove();
        if (event.target.matches("[data-flag]")) item.classList.toggle("insight-flagged");
        if (event.target.matches("[data-report]")) { localStorage.setItem("iot-insight-report-insight", item.querySelector("p").innerText); event.target.textContent = "Added"; }
    });
});