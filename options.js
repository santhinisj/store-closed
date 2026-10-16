import { getSettings, isBlocking, cleanDomain, formatTime } from "./shared.js";

const $ = (id) => document.getElementById(id);
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

async function render() {
  const s = await getSettings();
  $("start").value = s.start;
  $("end").value = s.end;
  $("domains").value = s.domains.join("\n");
  $("days").innerHTML = ORDER.map((d) => `
    <label><input type="checkbox" value="${d}" ${s.days.includes(d) ? "checked" : ""}> ${DAY_NAMES[d]}</label>
  `).join("");

  // No editing the rules while they're in force, or the lock is just a suggestion.
  const locked = await isBlocking();
  $("lock").hidden = !locked;
  $("unlock").textContent = formatTime(s.end);
  for (const el of $("form").querySelectorAll("input, textarea, button")) el.disabled = locked;
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (await isBlocking()) return render();

  const start = $("start").value;
  const end = $("end").value;
  if (start >= end) {
    $("saved").textContent = "End time needs to be after start time.";
    return;
  }
  const domains = [...new Set($("domains").value.split("\n").map(cleanDomain).filter(Boolean))];
  const days = [...$("days").querySelectorAll("input:checked")].map((i) => Number(i.value));

  await chrome.storage.sync.set({ start, end, days, domains });
  $("saved").textContent = "Settings saved.";
  render();
});

render();
setInterval(render, 60_000);
