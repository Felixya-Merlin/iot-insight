/* =========================================================
   Navigation
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const mobileMenu =
        document.getElementById("mobileMenu") || document.getElementById("menuButton");

    const sidebar =
        document.querySelector(".sidebar");


    /* Mobile sidebar */

    if (mobileMenu && sidebar) {

        mobileMenu.addEventListener("click", function () {

            sidebar.classList.toggle("open");

        });

    }


    /* Automatically highlight current page */

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();


    const order = [
        ["dashboard.html", "Dashboard"],
        ["data-import.html", "Import Data"],
        ["devices.html", "Devices"],
        ["device-details.html", "Device Details"],
        ["analysis.html", "Analysis"],
        ["alerts.html", "Alerts"],
        ["reports.html", "Reports"],
        ["insights.html", "Insights"],
        ["account.html", "Account"],
        ["settings.html", "Settings"]
    ];
    const nav = document.querySelector(".sidebar-nav");
    if (nav) {
        nav.querySelectorAll("a, button[data-logout]").forEach(item => item.remove());
        order.forEach(([href, label]) => {
            const link = document.createElement("a");
            link.href = href;
            link.className = "nav-link";
            link.innerHTML = `<span class="nav-icon">${label === "Insights" ? "✦" : "•"}</span><span>${label}</span>`;
            nav.appendChild(link);
        });
        if (!document.querySelector("[data-logout]")) {
            const button = document.createElement("button");
            button.type = "button";
            button.dataset.logout = "true";
            button.className = "nav-link nav-action";
            button.textContent = "Sign out";
            nav.appendChild(button);
        }
    }

    const navigationLinks = document.querySelectorAll(".nav-link");


    navigationLinks.forEach(function (link) {

        const linkPage =
            link.getAttribute("href");

        if (linkPage === currentPage) {

            link.classList.add("active");

        } else {

            link.classList.remove("active");

        }

    });

});