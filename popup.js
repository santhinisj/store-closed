import { getSettings, isBlocking, formatTime, cleanDomain, addDomain } from "./shared.js";

const $ = (id) => document.getElementById(id);

async function renderState() {
  const s = await getSettings();
  const on = await isBlocking();
  $("dot").classList.toggle("on", on);
  $("state-text").textContent = on
    ? `Store's closed until ${formatTime(s.end)}`
    : `Not blocking right now`;
}

function show(text, ok = false) {
  $("msg").textContent = text;
  $("msg").classList.toggle("ok", ok);
}

async function add(raw) {
  const result = await addDomain(raw);
  if (!result.ok) return show(result.reason);
  show(`Added ${result.domain}.`, true);
  return result;
}

// Offer the site in the current tab, unless it's a browser page or already blocked.
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
let currentHost = "";
try {
  const url = new URL(tab?.url ?? "");
  if (url.protocol.startsWith("http")) currentHost = cleanDomain(url.hostname);
} catch {}

if (currentHost) {
  const { domains } = await getSettings();
  const alreadyBlocked = domains.some((d) => currentHost === d || currentHost.endsWith("." + d));
  $("current").hidden = false;
  $("host").textContent = currentHost;
  if (alreadyBlocked) {
    $("block-current").disabled = true;
    $("block-current").textContent = "Already blocked";
  }
}

$("block-current").addEventListener("click", async () => {
  const result = await add(currentHost);
  if (result?.ok) {
    $("block-current").disabled = true;
    $("block-current").textContent = "Blocked";
  }
});

$("add-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const result = await add($("add-input").value);
  if (result?.ok) $("add-input").value = "";
});

$("open-settings").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

renderState();
