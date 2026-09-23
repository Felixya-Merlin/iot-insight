// function getTimeTheme() {
//     const hour = new Date().getHours();

//     if (hour >= 5 && hour < 12) return 'morning';
//     if (hour >= 12 && hour < 17) return 'afternoon';
//     if (hour >= 17 && hour < 21) return 'evening';
//     return 'night';
// }

// function updateDashboardGreeting() {
//     const heading = document.getElementById('dashboardGreeting');
//     if (heading) {
//         const hour = new Date().getHours();
//         let greeting = 'IOT Insight';

//         if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
//         else if (hour >= 17 && hour < 21) greeting = 'Good evening';
//         else if (hour >= 21 || hour < 5) greeting = 'Good night';

//         heading.textContent = greeting;
//     }

//     const body = document.body;
//     if (!body) return;

//     body.classList.remove('theme-morning', 'theme-afternoon', 'theme-evening', 'theme-night');
//     body.classList.add(`theme-${getTimeTheme()}`);
// }

// document.addEventListener('DOMContentLoaded', updateDashboardGreeting);
// updateDashboardGreeting();
// setInterval(updateDashboardGreeting, 60000);
