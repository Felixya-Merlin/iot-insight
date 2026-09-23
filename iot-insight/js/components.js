/*
 * components.js
 *
 * Small reusable UI functions.
 */


/**
 * Open a modal.
 */
function openModal(modalId) {

    const modal =
        document.getElementById(modalId);

    if (!modal) {
        return;
    }

    modal.classList.add("show");

}


/**
 * Close a modal.
 */
function closeModal(modalId) {

    const modal =
        document.getElementById(modalId);

    if (!modal) {
        return;
    }

    modal.classList.remove("show");

}


/**
 * Show an empty state.
 */
function showEmptyState(
    elementId,
    message
) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = message;

}


/**
 * Show a page message.
 */
function showPageMessage(
    elementId,
    message
) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = message;

    element.classList.remove("hidden");

}


/**
 * Hide a page message.
 */
function hidePageMessage(elementId) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.classList.add("hidden");

}