# Store's Closed

A Chrome extension that blocks shopping sites during work hours (9 to 5, Mon–Fri by default).

## Install
1. Unzip this folder.
2. Go to `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the `stores-closed` folder.
4. Pin it. Clicking the icon lets you block the site you're on or add any other site.
   Use **Edit hours and blocked sites** in the popup for the full settings.

## How it works
- `background.js` checks the clock every minute and on browser start. During work hours it adds a
  `declarativeNetRequest` redirect rule for every blocked domain (subdomains included), and sends any
  already-open shopping tabs to the closed page.
- The closed page has a 10-minute break you can take by typing a sentence out by hand (paste is disabled).
- Settings are locked while the block is active. Adding sites from the popup still works then,
  since that only makes the block stricter; removing them has to wait until after hours.
- Settings sync across Chrome profiles signed in to the same account.

## Tweaks
- Break length and phrase: `SNOOZE_MINUTES` and `SNOOZE_PHRASE` in `shared.js`.
- Default blocklist: `DEFAULTS.domains` in `shared.js` (only used on first install).
