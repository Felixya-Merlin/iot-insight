/* Reusable Chart.js helpers. Only render when real data is supplied. */

function createLineChart(canvasId, labels, values, label = "Parameter") {
    if (typeof Chart === "undefined" || !Array.isArray(labels) || !Array.isArray(values) || !labels.length) return null;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    return new Chart(canvas, {
        type: "line",
        data: { labels, datasets: [{ label, data: values, tension: 0.25, fill: false }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function createBarChart(canvasId, labels, values, label = "Value") {
    if (typeof Chart === "undefined" || !Array.isArray(labels) || !Array.isArray(values) || !labels.length) return null;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    return new Chart(canvas, {
        type: "bar",
        data: { labels, datasets: [{ label, data: values }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function createStateChart(canvasId, labels, states) {
    if (typeof Chart === "undefined" || !Array.isArray(labels) || !Array.isArray(states) || !labels.length) return null;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const values = states.map(state => String(state).toUpperCase() === "ON" ? 1 : 0);

    return new Chart(canvas, {
        type: "line",
        data: { labels, datasets: [{ label: "Active field", data: values, stepped: true, tension: 0, fill: false }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 1, ticks: { stepSize: 1, callback: value => value === 1 ? "ON" : "OFF" } } }
        }
    });
}

function showChartEmptyState(emptyElementId, canvasId, hasData) {
    const emptyElement = document.getElementById(emptyElementId);
    const canvas = document.getElementById(canvasId);
    if (!emptyElement || !canvas) return;
    emptyElement.classList.toggle("hidden", Boolean(hasData));
    canvas.classList.toggle("hidden", !hasData);
}
