/*
 * Alerts Page
 *
 * No alerts are generated on the frontend.
 * Alerts will come from the backend after
 * sensor data and thresholds are configured.
 */

document.addEventListener("DOMContentLoaded", () => {

    const filterButtons =
        document.querySelectorAll(".filter-tab");

    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            filterButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            const filter =
                button.dataset.filter;

            console.log("Selected alert filter:", filter);

            /*
             * Future:
             *
             * Fetch alerts from FastAPI:
             *
             * GET /api/alerts
             *
             * Then display only:
             * all
             * warning
             * critical
             * resolved
             */
        });

    });

});