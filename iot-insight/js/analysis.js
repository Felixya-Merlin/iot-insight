/*
 * Analysis Page
 *
 * Currently this file handles only UI interactions.
 * Real calculations will be added when the backend
 * provides sensor readings.
 */

document.addEventListener("DOMContentLoaded", () => {

    const filterButtons =
        document.querySelectorAll(".filter-tab");

    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            // Remove active state
            filterButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            // Add active state
            button.classList.add("active");

            const selectedRange =
                button.dataset.range;

            console.log(
                "Selected analysis range:",
                selectedRange
            );

            /*
             * Future:
             *
             * 1. Request readings from FastAPI
             * 2. Filter readings based on date range
             * 3. Calculate:
             *    - Min
             *    - Max
             *    - Average
             *    - Median
             *    - Standard deviation
             *    - Rate of change
             *    - Moving average
             *    - Anomalies
             * 4. Update Chart.js
             */
        });

    });

});