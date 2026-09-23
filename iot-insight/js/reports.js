import { loadFirebaseData, showDataError } from "./firebase-data.js";

document.addEventListener("DOMContentLoaded", async () => {
    let data;
    try { data = await loadFirebaseData(); } catch (error) { showDataError(error); return; }

    const { readings, devices, parameters } = data;
    const device = devices[0];
    const preview = document.getElementById("reportPreview");
    const message = document.getElementById("reportMessage");
    const parameterSelect = document.getElementById("reportParameter");
    const graphSelection = document.getElementById("reportGraphs");
    let reportCharts = [];
    if (!device) { preview.innerHTML = "<p>No active imported dataset is available.</p>"; return; }

    const fields = [...new Set(parameters.map(item => item.parameterName).concat(readings.map(item => item.parameterName)).filter(Boolean))];
    const parameterGraphs = fields
        .filter(field => readings.some(item => item.parameterName === field && Number.isFinite(Number(item.value))))
        .map((field, index) => ({ id: `parameter-${index}`, field, title: `${field} trend` }));
    const insightGraphs = fields
        .filter(field => readings.some(item => item.parameterName === field && Number.isFinite(Number(item.value))))
        .map((field, index) => ({ id: `insight-${index}`, field, title: `${field} insight graph` }));
    const graphDefinitions = [...parameterGraphs, ...insightGraphs];
    document.getElementById("reportDevice").innerHTML = `<option value="${escapeHtml(device.deviceId)}">${escapeHtml(device.deviceName || device.deviceId)}</option>`;
    parameterSelect.innerHTML = ["All parameters", ...fields].map(field => `<option value="${escapeHtml(field === "All parameters" ? "" : field)}">${escapeHtml(field)}</option>`).join("");
    graphSelection.innerHTML = `<legend>Include graphs <span class="muted">(untick graphs you do not need)</span></legend>${graphDefinitions.map(graph => `<label><input type="checkbox" name="reportGraph" value="${graph.id}" checked> ${escapeHtml(graph.title)}</label>`).join("")}${graphDefinitions.length ? "" : "<div class=\"muted\">No numeric graphs are available for the selected dataset.</div>"}`;

    function filteredReadings() {
        const start = document.getElementById("startDate").value;
        const end = document.getElementById("endDate").value;
        return readings.filter(reading => (!parameterSelect.value || reading.parameterName === parameterSelect.value) && (!start || reading.timestamp.slice(0, 10) >= start) && (!end || reading.timestamp.slice(0, 10) <= end));
    }
    function selectedSections() { return [...document.querySelectorAll("[name=reportSection]:checked")].map(input => input.value); }
    function selectedGraphs() { return graphDefinitions.filter(graph => [...document.querySelectorAll("[name=reportGraph]:checked")].some(input => input.value === graph.id)); }
    function stats(field, selected) {
        const values = selected.filter(item => item.parameterName === field).map(item => Number(item.value)).filter(Number.isFinite);
        if (!values.length) return "categorical values";
        return `min ${Math.min(...values).toFixed(2)}, max ${Math.max(...values).toFixed(2)}, average ${(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)}`;
    }
    function insightText(selected) { return fields.map(field => `${field}: ${stats(field, selected)}`).join(" | "); }
    function reportModel() {
        const selected = filteredReadings();
        const sections = selectedSections();
        const graphs = selectedGraphs();
        const lines = ["IoT Insight Sensor Report", `Device name: ${device.deviceName || "Unnamed device"}`, `Device ID: ${device.deviceId}`, `Location: ${device.location || "Not specified"}`, `Parameters: ${fields.join(", ")}`, `Generated: ${new Date().toLocaleString()}`, ""];
        if (sections.includes("summary")) lines.push("EXECUTIVE SUMMARY", `Total readings: ${selected.length}`, `Active parameters: ${fields.length}`, "");
        if (sections.includes("devices")) lines.push("DEVICE OVERVIEW", `Device name: ${device.deviceName || "Unnamed device"}`, `Device identifier: ${device.deviceId}`, `Status: ${device.status || "active import"}`, "");
        if (sections.includes("parameters")) lines.push("PARAMETER STATISTICS", ...fields.map(field => `${field}: ${stats(field, selected)}`), "");
        if (sections.includes("visualizations")) lines.push("VISUALIZATIONS AND ANALYSIS", `Included graphs: ${graphs.map(graph => graph.title).join(", ") || "None"}`, `Numeric readings: ${selected.filter(item => Number.isFinite(Number(item.value))).length}`, "");
        if (sections.includes("alerts")) lines.push("ALERT HISTORY", `Values above 9.5: ${selected.filter(item => Number(item.value) > 9.5).length}`, "");
        if (sections.includes("insights")) lines.push("GENERATED INSIGHTS", localStorage.getItem("iot-insight-report-insight") || insightText(selected), "");
        return { selected, sections, graphs, text: lines.join("\n") };
    }
    function render() {
        const model = reportModel();
        reportCharts.forEach(chart => chart.destroy());
        reportCharts = [];
        preview.innerHTML = `<div class="report-preview-content" contenteditable="true"><h3>IoT Insight Report</h3><p><strong>Device name:</strong> ${escapeHtml(device.deviceName || "Unnamed device")}<br><strong>Device ID:</strong> ${escapeHtml(device.deviceId)}<br><strong>Parameters:</strong> ${escapeHtml(fields.join(", "))}</p><pre>${escapeHtml(model.text)}</pre><div id="reportGraphHost" class="report-graph-host"></div></div><p class="muted">Edit the report text directly before downloading.</p>`;
        const graphHost = document.getElementById("reportGraphHost");
        if (model.sections.includes("visualizations") && model.graphs.length && typeof Chart !== "undefined") {
            model.graphs.forEach((graph, index) => {
                const items = model.selected.filter(item => item.parameterName === graph.field && Number.isFinite(Number(item.value))).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                if (!items.length) return;
                const card = document.createElement("section");
                card.className = "chart-card report-chart-card";
                card.innerHTML = `<h4>${escapeHtml(graph.title)}</h4><canvas id="report-chart-${index}"></canvas>`;
                graphHost.append(card);
                reportCharts.push(new Chart(card.querySelector("canvas"), { type: "line", data: { labels: items.map(item => new Date(item.timestamp).toLocaleString()), datasets: [{ label: graph.field, data: items.map(item => Number(item.value)), borderColor: ["#2563eb", "#27705e", "#d97706", "#b42318"][index % 4], backgroundColor: "rgba(37,99,235,.12)", fill: true, tension: .25, spanGaps: true }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { autoSkip: true, maxTicksLimit: 12, maxRotation: 45 } }, y: { title: { display: true, text: graph.field } } } } }));
            });
        }
        message.textContent = "Report preview updated";
        message.classList.remove("hidden");
    }
    function download(name, content, type) { const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([content], { type })); link.download = name; link.click(); URL.revokeObjectURL(link.href); }

    document.getElementById("reportForm").addEventListener("submit", event => { event.preventDefault(); render(); });
    document.querySelectorAll("[name=reportSection], [name=reportGraph], #reportParameter, #startDate, #endDate").forEach(input => input.addEventListener("change", render));
    document.getElementById("downloadCsv").addEventListener("click", () => {
        const model = reportModel();
        const metadata = ["# IoT Insight Sensor Report", `# Device name: ${device.deviceName || "Unnamed device"}`, `# Device ID: ${device.deviceId}`, `# Parameters: ${fields.join(" | ")}`, `# Sections: ${model.sections.join(" | ")}`, `# Graphs: ${model.graphs.map(graph => graph.title).join(" | ") || "None"}`, `# Insight: ${localStorage.getItem("iot-insight-report-insight") || "Generated from active field statistics"}`];
        const rows = model.selected.map(item => [item.timestamp, item.deviceId, item.parameterName, item.rawValue ?? item.value, item.state].map(value => JSON.stringify(value ?? "")).join(","));
        download("iot-insight-report.csv", [...metadata, "timestamp,device,parameter,value,state", ...rows].join("\n"), "text/csv");
    });
    document.getElementById("downloadPdf").addEventListener("click", () => {
        if (!preview.querySelector(".report-preview-content")) render();
        const content = preview.querySelector(".report-preview-content").cloneNode(true);
        content.querySelectorAll("canvas").forEach((canvas, index) => {
            const chart = reportCharts[index];
            if (!chart) return;
            const image = document.createElement("img");
            image.src = chart.toBase64Image();
            image.style.width = "100%";
            image.style.maxHeight = "260px";
            image.style.objectFit = "contain";
            canvas.replaceWith(image);
        });
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`<html><head><title>IoT Insight Report</title><style>body{font:12px Arial;color:#182a2b;max-width:760px;margin:24px auto}pre{white-space:pre-wrap;line-height:1.4}img{display:block;margin-top:16px}</style></head><body>${content.innerHTML}</body></html>`);
        printWindow.document.close(); printWindow.focus(); printWindow.print();
    });
    render();
});

function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
