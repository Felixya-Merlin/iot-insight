import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { firebaseConfig, firebaseIsConfigured } from "./firebase-config.js";

const app = firebaseIsConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const auth = app ? getAuth(app) : null;

export function watchAuth({ requireAuth = true } = {}) {
    if (!auth) {
        if (requireAuth) {
            const redirect = window.location.pathname.endsWith("index.html") ? "index.html" : "../index.html";
            window.location.href = redirect;
        }
        return () => {};
    }

    return onAuthStateChanged(auth, user => {
        if (requireAuth && !user) {
            window.location.href = "../index.html";
            return;
        }

        if (!requireAuth && user && window.location.pathname.endsWith("index.html")) {
            window.location.href = "pages/dashboard.html";
        }

        const userIdentifier = user?.email || "Signed out";
        document.querySelectorAll("[data-user-email]").forEach(element => {
            element.textContent = user?.email || "Signed out";
        });
        document.querySelectorAll("[data-user-name]").forEach(element => {
            element.textContent = user?.displayName || user?.email || "Signed out";
        });
        document.querySelectorAll("[data-user-id]").forEach(element => {
            element.textContent = userIdentifier;
        });

        const topbar = document.querySelector(".topbar");
        if (topbar && !topbar.querySelector("[data-session-identity]")) {
            const sessionIdentity = document.createElement("div");
            sessionIdentity.className = "session-identity";
            sessionIdentity.dataset.sessionIdentity = "true";
            sessionIdentity.innerHTML = '<span>USER EMAIL</span><strong data-user-id></strong>';
            topbar.appendChild(sessionIdentity);
        }
        const sessionIdElement = topbar?.querySelector("[data-user-id]");
        if (sessionIdElement) sessionIdElement.textContent = userIdentifier;
    });
}

export async function loginWithEmail(email, password) {
    if (!auth) throw new Error("Firebase authentication is not configured.");
    return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email, password, displayName) {
    if (!auth) throw new Error("Firebase authentication is not configured.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
    }
    return userCredential;
}

export async function resetPassword(email) {
    if (!auth) throw new Error("Firebase authentication is not configured.");
    return sendPasswordResetEmail(auth, email);
}

export function logout() {
    return auth ? signOut(auth) : Promise.resolve();
}

document.addEventListener("click", event => {
    if (event.target.closest("[data-logout]")) logout();
});

if (document.getElementById("loginForm")) {
    const loginForm = document.getElementById("loginForm");
    const loginButton = document.getElementById("loginButton");
    const loginMessage = document.getElementById("loginMessage");

    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        loginButton.disabled = true;
        loginButton.textContent = "Signing in...";
        loginMessage.textContent = "";

        try {
            await loginWithEmail(email, password);
            loginMessage.textContent = "✓ Login successful";
            setTimeout(() => {
                window.location.href = "pages/dashboard.html";
            }, 700);
        } catch (error) {
            loginMessage.textContent = getFirebaseError(error.code);
            loginButton.disabled = false;
            loginButton.textContent = "Sign In";
        }
    });
}

if (document.getElementById("signupForm")) {
    const signupForm = document.getElementById("signupForm");
    const signupButton = document.getElementById("signupButton");
    const signupMessage = document.getElementById("signupMessage");

    signupForm.addEventListener("submit", async event => {
        event.preventDefault();

        const fullName = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            signupMessage.textContent = "Passwords do not match.";
            return;
        }

        if (password.length < 6) {
            signupMessage.textContent = "Password must contain at least 6 characters.";
            return;
        }

        signupButton.disabled = true;
        signupButton.textContent = "Creating account...";
        signupMessage.textContent = "";

        try {
            await registerWithEmail(email, password, fullName);
            signupMessage.textContent = "✓ Account created successfully";
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 1000);
        } catch (error) {
            signupMessage.textContent = getFirebaseError(error.code);
            signupButton.disabled = false;
            signupButton.textContent = "Create Account";
        }
    });
}

if (document.getElementById("forgotPasswordForm")) {
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    const forgotButton = document.getElementById("forgotPasswordButton");
    const forgotMessage = document.getElementById("forgotPasswordMessage");

    forgotPasswordForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("forgotPasswordEmail").value.trim();
        forgotButton.disabled = true;
        forgotButton.textContent = "Sending...";
        forgotMessage.textContent = "";

        try {
            await resetPassword(email);
            forgotMessage.textContent = "✓ Password reset email sent. Please check your inbox.";
            forgotButton.disabled = false;
            forgotButton.textContent = "Send Reset Link";
        } catch (error) {
            forgotMessage.textContent = getFirebaseError(error.code);
            forgotButton.disabled = false;
            forgotButton.textContent = "Send Reset Link";
        }
    });
}

function setupPasswordToggle(buttonId, inputId) {
    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);

    if (!button || !input) return;

    button.addEventListener("click", () => {
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        button.textContent = isPassword ? "🙈" : "👁";
    });
}

setupPasswordToggle("toggleLoginPassword", "loginPassword");
setupPasswordToggle("toggleSignupPassword", "signupPassword");
setupPasswordToggle("toggleForgotPassword", "forgotPasswordEmail");

const passwordInput = document.getElementById("signupPassword");
if (passwordInput) {
    passwordInput.addEventListener("input", function () {
        const password = passwordInput.value;
        const bar = document.getElementById("strengthBar");
        const text = document.getElementById("strengthText");

        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        const percentage = strength * 20;
        if (bar) bar.style.width = percentage + "%";

        if (text) {
            if (strength <= 1) text.textContent = "Weak password";
            else if (strength <= 3) text.textContent = "Medium password";
            else text.textContent = "Strong password";
        }
    });
}

function getFirebaseError(code) {
    const messages = {
        "auth/invalid-credential": "Invalid email or password.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/email-already-in-use": "An account already exists with this email.",
        "auth/weak-password": "Password is too weak.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/too-many-requests": "Too many attempts. Please try again later."
    };

    return messages[code] || "Something went wrong. Please try again.";
}

watchAuth({ requireAuth: !window.location.pathname.endsWith("index.html") && !window.location.pathname.endsWith("signup.html") && !window.location.pathname.endsWith("forgot-password.html") });