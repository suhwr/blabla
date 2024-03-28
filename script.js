const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeOptions = document.getElementById('theme-options');
const body = document.body;

themeToggleBtn.addEventListener('click', toggleThemeOptions);

function toggleThemeOptions() {
    themeOptions.classList.toggle('show');
}

const themeOptionsList = themeOptions.getElementsByClassName('theme-option');
for (let i = 0; i < themeOptionsList.length; i++) {
    themeOptionsList[i].addEventListener('click', changeTheme);
}

function changeTheme() {
    const selectedTheme = this.id;
    body.className = selectedTheme;
}
function changeTheme() {
    const selectedTheme = this.id;
    body.className = selectedTheme;
    localStorage.setItem('selectedTheme', selectedTheme);
}
window.addEventListener('DOMContentLoaded', function() {
    const selectedTheme = localStorage.getItem('selectedTheme');
    if (selectedTheme) {
        body.className = selectedTheme;
    }
});
