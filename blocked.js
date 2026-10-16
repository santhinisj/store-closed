import { getSettings, formatTime, SNOOZE_MINUTES, SNOOZE_PHRASE } from "./shared.js";

const $ = (id) => document.getElementById(id);
const original = location.hash.slice(1);

const s = await getSettings();
$("reopen").textContent = formatTime(s.end);
$("phrase-text").textContent = SNOOZE_PHRASE;
$("mins").textContent = $("mins2").textContent = SNOOZE_MINUTES;

if (original) {
  try {
    const host = new URL(original).hostname.replace(/^www\./, "");
    $("site").textContent = `${host} is blocked during work hours. Whatever's in the cart will still be there tonight.`;
  } catch {}
}

// Typing it out is the point, so pasting doesn't count.
$("phrase").addEventListener("paste", (e) => e.preventDefault());
$("phrase").addEventListener("input", (e) => {
  $("snooze").disabled = e.target.value.trim() !== SNOOZE_PHRASE;
});

$("snooze").addEventListener("click", async () => {
  $("snooze").disabled = true;
  const { snoozeUntil } = await chrome.runtime.sendMessage({ type: "snooze" });
  const until = new Date(snoozeUntil).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  $("status").textContent = `Store's open until ${until}.`;
  setTimeout(() => {
    if (original) location.replace(original);
  }, 800);
});
