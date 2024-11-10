// script.js
document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.getElementById("mode-toggle");

    // Check if the user has a preferred theme
    const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedMode = localStorage.getItem("theme");

    if (savedMode === "dark" || (savedMode === null && userPrefersDark)) {
        document.body.classList.add("dark-mode");
    }

    // Toggle light/dark mode
    toggleButton.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDarkMode = document.body.classList.contains("dark-mode");
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    });
});