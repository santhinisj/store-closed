import { getSettings, isBlocking, SNOOZE_MINUTES } from "./shared.js";

const RULE_ID = 1;
const BLOCKED_URL = chrome.runtime.getURL("blocked.html");

const matches = (hostname, domains) =>
  domains.some((d) => hostname === d || hostname.endsWith("." + d));

async function sync() {
  const s = await getSettings();
  const block = await isBlocking();

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: block
      ? [{
          id: RULE_ID,
          priority: 1,
          // Keep the original URL in the hash so a break can send you straight back.
          action: { type: "redirect", redirect: { regexSubstitution: BLOCKED_URL + "#\\1" } },
          condition: { regexFilter: "^(.*)$", requestDomains: s.domains, resourceTypes: ["main_frame"] }
        }]
      : []
  });

  // Rules only catch new navigations, so also close the door on tabs already open.
  if (block) {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        const { hostname } = new URL(tab.url ?? "");
        if (matches(hostname.replace(/^www\./, ""), s.domains)) {
          chrome.tabs.update(tab.id, { url: BLOCKED_URL + "#" + tab.url });
        }
      } catch { /* chrome:// pages, blank tabs */ }
    }
  }
}

function ensureAlarm() {
  chrome.alarms.get("tick", (a) => {
    if (!a) chrome.alarms.create("tick", { periodInMinutes: 1 });
  });
}

chrome.runtime.onInstalled.addListener(() => { ensureAlarm(); sync(); });
chrome.runtime.onStartup.addListener(() => { ensureAlarm(); sync(); });
chrome.alarms.onAlarm.addListener((a) => { if (a.name === "tick") sync(); });
chrome.storage.onChanged.addListener(() => sync());

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg?.type === "snooze") {
    const snoozeUntil = Date.now() + SNOOZE_MINUTES * 60_000;
    chrome.storage.local.set({ snoozeUntil }).then(sync).then(() => reply({ snoozeUntil }));
    return true;
  }
});
