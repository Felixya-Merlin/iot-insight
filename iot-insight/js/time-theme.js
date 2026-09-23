function updateTimeTheme() {
    const page = document.getElementById("authPage");
    const sun = document.getElementById("sun");
    const moon = document.getElementById("moon");
    const glow = document.querySelector(".sky-glow");

    if (!page) return;

    const hour = new Date().getHours();

    page.classList.remove("morning", "afternoon", "evening", "night");

    if (hour >= 5 && hour < 12) {
        page.classList.add("morning");
        sun.style.left = "18%";
        sun.style.top = "30%";
        glow.style.left = "22%";
        glow.style.top = "34%";
    } else if (hour >= 12 && hour < 17) {
        page.classList.add("afternoon");
        sun.style.left = "48%";
        sun.style.top = "13%";
        glow.style.left = "52%";
        glow.style.top = "18%";
    } else if (hour >= 17 && hour < 20) {
        page.classList.add("evening");
        sun.style.left = "75%";
        sun.style.top = "38%";
        glow.style.left = "78%";
        glow.style.top = "43%";
    } else {
        page.classList.add("night");
        moon.style.left = "75%";
        moon.style.top = "20%";
        glow.style.left = "50%";
        glow.style.top = "50%";
    }
}

updateTimeTheme();
setInterval(updateTimeTheme, 60000);
