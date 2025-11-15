const oracleMessages = [
"Someone is already gravitating toward you.",
"You are not late; you are right on your own orbit.",
"What you want also wants you, but it needs you to choose.",
"You do not have to earn rest. You are already celestial.",
"The next step is small and specific. Take it, then listen again.",
"Release what keeps rehearsing in your head. The stars prefer new scripts."
];

document.addEventListener("DOMContentLoaded", () => {
const yearSpan = document.getElementById("year");
if (yearSpan) {
yearSpan.textContent = new Date().getFullYear();
}

const btn = document.getElementById("oracle-button");
const input = document.getElementById("oracle-input");
const output = document.getElementById("oracle-output");

if (btn && input && output) {
btn.addEventListener("click", () => {
const idx = Math.floor(Math.random() * oracleMessages.length);
const msg = oracleMessages[idx];
const question = input.value.trim();
if (!question) {
output.innerHTML = `<p>${msg}</p>`;
} else {
output.innerHTML = `<p>“${msg}”</p><p class="oracle-output__note">You asked: <span>${question}</span></p>`;
}
});
}
});
