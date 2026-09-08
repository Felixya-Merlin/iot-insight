/*
 * api.js
 *
 * Central API service.
 *
 * Future architecture:
 *
 * FastAPI
 *    ↓
 * api.js
 *    ↓
 * Page JavaScript
 *    ↓
 * UI / Chart.js
 *
 * No API calls are made until the backend is ready.
 */


/*
 * When FastAPI is created, change this value.
 *
 * Example:
 *
 * const API_BASE_URL = "http://127.0.0.1:8000";
 *
 */

const API_BASE_URL = "";


/**
 * Generic API request function.
 */
async function apiRequest(
    endpoint,
    options = {}
) {

    if (!API_BASE_URL) {

        return {

            success: false,

            data: null,

            message:
                "Backend API is not connected yet."

        };

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                options
            );


        if (!response.ok) {

            throw new Error(
                `API request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        return {

            success: true,

            data: data,

            message: "Success"

        };

    } catch (error) {

        console.error(
            "API Error:",
            error
        );


        return {

            success: false,

            data: null,

            message: error.message

        };

    }

}


/**
 * Get all devices.
 */
async function getDevices() {

    return apiRequest(
        "/api/devices"
    );

}


/**
 * Get one device.
 */
async function getDevice(deviceId) {

    return apiRequest(
        `/api/devices/${deviceId}`
    );

}


/**
 * Get parameters.
 */
async function getParameters() {

    return apiRequest(
        "/api/parameters"
    );

}


/**
 * Get readings.
 */
async function getReadings(
    deviceId,
    parameterId,
    startDate,
    endDate
) {

    const query =
        new URLSearchParams();


    if (deviceId) {
        query.append(
            "device_id",
            deviceId
        );
    }


    if (parameterId) {
        query.append(
            "parameter_id",
            parameterId
        );
    }


    if (startDate) {
        query.append(
            "start_date",
            startDate
        );
    }


    if (endDate) {
        query.append(
            "end_date",
            endDate
        );
    }


    return apiRequest(
        `/api/readings?${query.toString()}`
    );

}


/**
 * Get alerts.
 */
async function getAlerts() {

    return apiRequest(
        "/api/alerts"
    );

}