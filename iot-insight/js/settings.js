/*
 * Settings Page
 *
 * Currently settings are handled only in the UI.
 * Later they can be saved through FastAPI/Firebase.
 */

document.addEventListener("DOMContentLoaded", () => {

    const saveButton =
        document.getElementById("saveSettings");

    const message =
        document.getElementById("settingsMessage");


    saveButton.addEventListener("click", () => {

        message.textContent =
            "Settings interface is ready. Backend persistence will be connected later.";

        message.classList.remove("hidden");

    });

});