export const DEFAULTS = {
  domains: [
    "amazon.ca", "amazon.com", "bestbuy.ca", "walmart.ca", "costco.ca",
    "canadiantire.ca", "ebay.ca", "ebay.com", "etsy.com", "shein.com",
    "temu.com", "aliexpress.com", "wayfair.ca", "indigo.ca", "simons.ca",
    "aritzia.com", "lululemon.com", "sephora.com", "zara.com", "hm.com"
  ],
  start: "09:00",
  end: "17:00",
  days: [1, 2, 3, 4, 5] // 0 = Sunday
};

export const SNOOZE_MINUTES = 10;
export const SNOOZE_PHRASE = "I am choosing to shop during work hours";

export async function getSettings() {
  return chrome.storage.sync.get(DEFAULTS);
}

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function inWorkHours(s, now = new Date()) {
  if (!s.days.includes(now.getDay())) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= toMinutes(s.start) && mins < toMinutes(s.end);
}

export async function isBlocking(now = new Date()) {
  const s = await getSettings();
  const { snoozeUntil = 0 } = await chrome.storage.local.get("snoozeUntil");
  return inWorkHours(s, now) && now.getTime() >= snoozeUntil && s.domains.length > 0;
}

export function cleanDomain(raw) {
  return raw.trim().toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#:]/)[0];
}

export function formatTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Adding a site only makes the block stricter, so it's allowed any time, even during work hours.
export async function addDomain(raw) {
  const domain = cleanDomain(raw);
  if (!domain || !domain.includes(".")) return { ok: false, reason: "That doesn't look like a website." };
  const { domains } = await getSettings();
  if (domains.some((d) => domain === d || domain.endsWith("." + d))) {
    return { ok: false, reason: `${domain} is already blocked.` };
  }
  await chrome.storage.sync.set({ domains: [...domains, domain] });
  return { ok: true, domain };
}
