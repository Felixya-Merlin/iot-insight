import { loadFirebaseData, showDataError } from "./firebase-data.js";

const filters = {
    startDate: document.getElementById("alertStartDate"),
    endDate: document.getElementById("alertEndDate"),
    severity: document.getElementById("alertSeverity"),
    type: document.getElementById("alertType"),
    status: document.getElementById("alertStatus"),
    source: document.getElementById("alertSource")
};

let alerts = [];
let quickFilter = "all";

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function populateOptions(select, values, label) {
    const options = [...new Set(values.filter(Boolean).map(String))].sort();
    select.innerHTML = `<option value="all">All ${label}</option>${options.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}`;
}

function matchesFilters(alert) {
    const timestamp = new Date(alert.timestamp).getTime();
    const start = filters.startDate.value ? new Date(`${filters.startDate.value}T00:00:00`).getTime() : -Infinity;
    const end = filters.endDate.value ? new Date(`${filters.endDate.value}T23:59:59.999`).getTime() : Infinity;
    const quickMatches = quickFilter === "all" || alert.severity === quickFilter || alert.status === quickFilter;
    return quickMatches
        && timestamp >= start
        && timestamp <= end
        && (filters.severity.value === "all" || alert.severity === filters.severity.value)
        && (filters.type.value === "all" || alert.type === filters.type.value)
        && (filters.status.value === "all" || alert.status === filters.status.value)
        && (filters.source.value === "all" || alert.source === filters.source.value);
}

function render() {
    const visibleAlerts = alerts.filter(matchesFilters);
    const body = document.getElementById("alertsTableBody");
    const empty = document.getElementById("alertsEmptyState");
    const summary = document.querySelectorAll(".summary-card strong");

    summary[0].textContent = visibleAlerts.length;
    summary[1].textContent = visibleAlerts.filter(alert => alert.severity === "critical").length;
    summary[2].textContent = visibleAlerts.filter(alert => alert.severity === "warning").length;
    summary[3].textContent = visibleAlerts.filter(alert => alert.status === "resolved").length;
    body.innerHTML = visibleAlerts.map(alert => `
        <tr>
            <td>${escapeHtml(new Date(alert.timestamp).toLocaleString())}</td>
            <td>${escapeHtml(alert.deviceId)}</td>
            <td>${escapeHtml(alert.parameterName)}</td>
            <td>${escapeHtml(alert.type)}</td>
            <td>${escapeHtml(alert.value)}</td>
            <td>${escapeHtml(alert.threshold)}</td>
            <td>${escapeHtml(alert.severity)}</td>
            <td>${escapeHtml(alert.status)}</td>
            <td>${escapeHtml(alert.source)}</td>
        </tr>`).join("");
    empty.style.display = visibleAlerts.length ? "none" : "block";
}

function resetFilters() {
    filters.startDate.value = "";
    filters.endDate.value = "";
    filters.severity.value = "all";
    filters.type.value = "all";
    filters.status.value = "all";
    filters.source.value = "all";
    quickFilter = "all";
    document.querySelectorAll(".filter-tab").forEach(item => item.classList.toggle("active", item.dataset.filter === "all"));
    render();
}

document.addEventListener("DOMContentLoaded", async () => {
    let readings;
    try {
        ({ readings } = await loadFirebaseData());
    } catch (error) {
        showDataError(error);
        return;
    }

    const numeric = readings.filter(reading => Number.isFinite(Number(reading.value)));
    alerts = numeric.filter(reading => Number(reading.value) > 9.5).map(reading => ({
        ...reading,
        type: reading.alertType || reading.category || reading.parameterName || "Threshold",
        source: reading.sourceSystem || reading.module || reading.source || "Firebase",
        severity: reading.severity || (Number(reading.value) > 12 ? "critical" : "warning"),
        status: reading.status || "resolved",
        threshold: reading.threshold || "> 9.5"
    }));

    populateOptions(filters.type, alerts.map(alert => alert.type), "types");
    populateOptions(filters.source, alerts.map(alert => alert.source), "sources");
    Object.values(filters).forEach(input => input.addEventListener("change", render));
    document.querySelectorAll(".filter-tab").forEach(button => button.addEventListener("click", () => {
        quickFilter = button.dataset.filter;
        document.querySelectorAll(".filter-tab").forEach(item => item.classList.toggle("active", item === button));
        render();
    }));
    document.getElementById("resetAlertFilters").addEventListener("click", resetFilters);
    render();
});
