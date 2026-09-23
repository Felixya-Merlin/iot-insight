import {
    getAllReadings,
    getDevices,
    getParameters,
    isFirebaseReady
} from "./firebase-service.js";
import { loadThingSpeakData } from "./thingspeak-service.js";

export async function loadFirebaseData() {
    if (!isFirebaseReady()) throw new Error("Firebase is not configured. Add the Firebase Web App settings first.");
    const [readings, devices, parameters] = await Promise.all([
        getAllReadings(),
        getDevices(),
        getParameters()
    ]);
    if (readings.length || localStorage.getItem("iot-insight-active-import")) return { readings, devices, parameters, source: "Firebase" };
    try { return await loadThingSpeakData(); } catch (error) { console.warn("ThingSpeak fallback unavailable", error); return { readings, devices, parameters, source: "Firebase" }; }
}

export function showDataError(error) {
    console.error(error);
    const message = document.querySelector("[data-data-message]");
    if (message) {
        message.textContent = error.message;
        message.classList.remove("hidden");
    }
}