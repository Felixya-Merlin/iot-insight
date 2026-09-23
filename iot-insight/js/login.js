import { loginWithEmail, resetPassword, watchAuth } from "./auth.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("loginMessage");
const resetButton = document.getElementById("resetPassword");

function showMessage(text, type = "info") {
    message.textContent = text;
    message.className = `login-message ${type}`;
}

function authError(error) {
    const messages = {
        "auth/invalid-credential": "The email or password is incorrect.",
        "auth/user-not-found": "The email or password is incorrect.",
        "auth/wrong-password": "The email or password is incorrect.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
        "auth/invalid-email": "Enter a valid email address."
    };
    return messages[error.code] || "Authentication failed. Check your Firebase configuration and try again.";
}

form.addEventListener("submit", async event => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    if (!form.reportValidity()) return;
    showMessage("Signing in...", "info");
    try {
        await loginWithEmail(email, password);
        window.location.href = "pages/data-import.html";
    } catch (error) {
        showMessage(authError(error), "error");
    }
});

resetButton.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value.trim();
    if (!email) {
        showMessage("Enter your email first to receive a reset link.", "error");
        return;
    }
    try {
        await resetPassword(email);
        showMessage("Password reset instructions sent.", "success");
    } catch (error) {
        showMessage(authError(error), "error");
    }
});

watchAuth({ requireAuth: false });
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const message = document.getElementById("loginMessage");
    form.addEventListener("submit", event => {
        event.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        window.iotInsightDemo.login(email);
        message.textContent = "Login successful. Opening IoT Insight...";
        message.classList.remove("hidden");
        window.setTimeout(() => { window.location.href = "pages/dashboard.html"; }, 250);
    });
});