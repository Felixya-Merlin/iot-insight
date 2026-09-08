/* =========================================================
   Devices Page
   ========================================================= */

const deviceModal =
    document.getElementById("deviceModal");

const openDeviceModal =
    document.getElementById("openDeviceModal");

const closeDeviceModal =
    document.getElementById("closeDeviceModal");

const cancelDevice =
    document.getElementById("cancelDevice");


function openModal() {

    deviceModal.classList.add("active");

}


function closeModal() {

    deviceModal.classList.remove("active");

}


if (openDeviceModal) {

    openDeviceModal.addEventListener(
        "click",
        openModal
    );

}


if (closeDeviceModal) {

    closeDeviceModal.addEventListener(
        "click",
        closeModal
    );

}


if (cancelDevice) {

    cancelDevice.addEventListener(
        "click",
        closeModal
    );

}


/*
    IMPORTANT:

    This form does not create persistent devices yet.

    When FastAPI is ready:

    Form
      ↓
    devices.js
      ↓
    services/api.js
      ↓
    FastAPI
      ↓
    Database
*/

const saveDevice =
    document.getElementById("saveDevice");


if (saveDevice) {

    saveDevice.addEventListener(
        "click",
        function () {

            alert(
                "Device configuration UI is ready. Backend integration will be added later."
            );

            closeModal();

        }
    );

}