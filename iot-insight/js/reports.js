/*
 * Reports Page
 *
 * This page does not generate fake reports.
 * Real report generation will happen after
 * FastAPI provides historical data.
 */

document.addEventListener("DOMContentLoaded", () => {

    const reportForm =
        document.getElementById("reportForm");

    const downloadCsv =
        document.getElementById("downloadCsv");

    const reportMessage =
        document.getElementById("reportMessage");


    function showMessage(message) {

        reportMessage.textContent = message;

        reportMessage.classList.remove("hidden");

    }


    reportForm.addEventListener("submit", (event) => {

        event.preventDefault();

        showMessage(
            "No data available to generate this report."
        );

    });


    downloadCsv.addEventListener("click", () => {

        showMessage(
            "No data available to generate the CSV file."
        );

    });

});