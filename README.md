# AniChin Tracker (Firefox MV2)

Lightweight Firefox extension for `anichin.moe` to favorite series and mark episodes completed on the watch page. Data is stored locally in the browser.

## Install (Temporary in Firefox)
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select `manifest.json` in this folder
4. Visit `https://anichin.moe/` and open a series detail or watch page

## What It Does
- Favorite a series on:
  - Series detail page
  - Episode watch page
- Mark episodes completed from the watch page episode list
- Mark a range of episodes completed (e.g., 1–9) from the watch page
- Show progress as `completed/total`

## Supported Pages (Examples)
- Series detail page:
  - `https://anichin.moe/tomb-of-fallen-gods-season-3/`
- Episode watch page:
  - `https://anichin.moe/tomb-of-fallen-gods-season-3-episode-30-subtitle-indonesia/`

## DOM Assumptions
- Series title and URL from `.det h2 a`
- Total episodes from `.det span` pattern `- 30 / 52`
- Episode list from `.episodelist ul li`
- Current episode via `li.selected` or URL match

## Data Storage
Local-only browser storage via `storage.local`.

## Files
- `manifest.json` - Extension manifest (MV2)
- `content.js` - DOM parsing, storage, UI injection
- `content.css` - Styles for injected UI

## Troubleshooting
- If buttons don’t appear, the site’s DOM may have changed. Update selectors in `content.js`.
- If data resets, confirm the extension has `storage` permission and is loaded correctly.
