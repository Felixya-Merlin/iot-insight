import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, writeBatch, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { firebaseConfig, firebaseIsConfigured } from "./firebase-config.js";

let db = null;
let authReadyPromise = null;
if (firebaseIsConfigured) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    const auth = getAuth(app);
    authReadyPromise = new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            unsubscribe();
            if (user) resolve(user);
            else reject(new Error("Please sign in before accessing IoT Insight."));
        }, reject);
    });
}

export function isFirebaseReady() { return Boolean(db); }
export async function getFirebaseConnectionStatus() {
    if (!db || !authReadyPromise) return "Firebase not configured";
    try { await authReadyPromise; return "Firebase connected"; }
    catch (error) { return `Firebase authentication error: ${error.code || "unknown"}`; }
}
async function currentUser() {
    if (!db || !authReadyPromise) throw new Error("Firebase is not configured yet.");
    return authReadyPromise;
}
function activeImportId() { return localStorage.getItem("iot-insight-active-import"); }
async function scopedCollection(name) {
    const user = await currentUser();
    const importId = activeImportId();
    const snapshot = await getDocs(collection(db, name));
    return snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
        .filter(item => item.uid === user.uid && (!importId || item.importId === importId));
}

export async function saveImportedDataset({ deviceId, deviceName, location, parameterName, unit, sourceChannelId, sourceUrl, readings }) {
    const user = await currentUser();
    if (!readings.length) throw new Error("No valid readings were found in the CSV.");
    const importRef = doc(collection(db, "imports"));
    const importId = importRef.id;
    const fields = [...new Set(readings.map(reading => reading.parameterName || parameterName).filter(Boolean))];
    const parameterIds = new Map();
    localStorage.setItem("iot-insight-active-import", importId);
    await setDoc(importRef, { importId, uid: user.uid, source: "CSV import", readingCount: readings.length, importedAt: serverTimestamp() });
    await setDoc(doc(db, "devices", `${importId}_${deviceId}`), { importId, uid: user.uid, deviceId, deviceName, location: location || "", source: "CSV import", updatedAt: serverTimestamp() });
    for (const field of fields) {
        const parameterId = `${importId}_${deviceId}_${field}`.toLowerCase().replace(/[^a-z0-9_]+/g, "_");
        parameterIds.set(field, parameterId);
        await setDoc(doc(db, "parameters", parameterId), { importId, uid: user.uid, parameterId, deviceId, parameterName: field, unit: field === parameterName ? unit || "" : "", fieldName: field, sourceChannelId: sourceChannelId || "", updatedAt: serverTimestamp() });
    }
    for (let start = 0; start < readings.length; start += 450) {
        const batch = writeBatch(db);
        readings.slice(start, start + 450).forEach(reading => {
            const field = reading.parameterName || parameterName;
            const readingRef = doc(collection(db, "readings"));
            batch.set(readingRef, { importId, uid: user.uid, deviceId, parameterId: parameterIds.get(field), parameterName: field, timestamp: reading.timestamp, entryId: reading.entryId || "", value: reading.value, state: reading.state || "", rawValue: reading.rawValue ?? "", source: "CSV import", importedAt: serverTimestamp() });
        });
        await batch.commit();
    }
    await setDoc(importRef, { deviceId, fields, sourceChannelId: sourceChannelId || "", sourceUrl: sourceUrl || "", completedAt: serverTimestamp() }, { merge: true });
    return { deviceId, importId, importedCount: readings.length };
}
export async function getAllReadings() { return (await scopedCollection("readings")).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); }
export async function getRecentReadings(deviceId, parameterId, count = 100) { return (await getAllReadings()).filter(item => (!deviceId || item.deviceId === deviceId) && (!parameterId || item.parameterId === parameterId)).reverse().slice(0, count); }
export function getDevices() { return scopedCollection("devices"); }
export function getParameters() { return scopedCollection("parameters"); }
export async function saveDevice(device) {
    const user = await currentUser();
    const importId = activeImportId();
    if (!importId) throw new Error("Import a dataset before adding devices.");
    await setDoc(doc(db, "devices", `${importId}_${device.deviceId}`), { ...device, importId, uid: user.uid, updatedAt: serverTimestamp() }, { merge: true });
    return device;
}
