# AniChin Tracker (Firefox MV2)

Lightweight Firefox extension for `anichin.moe` to favorite series and mark episodes completed on the watch page. Data is stored locally in the browser.

## Firefox for Android
- This extension now exposes `options.html` via the toolbar popup (`browser_action.default_popup`) so settings are accessible on Android, where `options_ui` is not available.
- Ensure Firefox for Android is recent enough for GeckoView extension support (`strict_min_version: 120.0`).

## Install (Temporary in Firefox)
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select `manifest.json` in this folder
4. Visit your target site and open a series detail or watch page

## Build (Production)
1. Update the version in `manifest.json`.
2. Ensure a stable add-on ID and data collection declaration exist in `manifest.json`:
   - `"browser_specific_settings": { "gecko": { "id": "anichin-tracker@mushonnip.id", "data_collection_permissions": { "required": ["authenticationInfo","websiteActivity","websiteContent"] } } }`
3. Create a clean package (XPI is just a ZIP):
   - `zip -r anichin-tracker.xpi manifest.json content.js content.css options.html options.js options.css`
4. Upload `anichin-tracker.xpi` to [AMO](https://addons.mozilla.org/en-US/developers/) as **Unlisted** to get it signed.
5. Download the signed XPI from AMO and install it normally (regular installs require signing).

### CI Packaging
- GitHub Actions workflow: `.github/workflows/release-zip.yml`
- Trigger manually with **workflow_dispatch** or push a tag like `v0.1.2`.
- It builds the same package contents as above (`manifest.json content.js content.css options.html options.js options.css`) and uploads an `.xpi` artifact.

## Backend Setup (Cloudflare Worker + D1)
1. Create a D1 database:
   - `wrangler d1 create anichin_tracker`
2. Update `wrangler.toml` with the returned `database_id`.
3. Apply schema:
   - `wrangler d1 execute anichin_tracker --file schema.sql --remote`
4. Deploy worker:
   - `wrangler deploy`

### API Auth
Requests require a single `Authorization` header containing your API ID/KEY token.
Set it in the extension settings:
1. Open the extension settings page.
2. Paste your token in **Authorization Token**.
3. Save.

## What It Does
- Favorite a series on:
  - Series detail page
  - Episode watch page
- Mark episodes completed from the watch page episode list
- Mark a range of episodes completed (e.g., 1–9) from the watch page
- Show progress as `completed/total`

## Supported Pages (Examples)
- Series detail page:
  - `https://example.com/tomb-of-fallen-gods-season-3/`
- Episode watch page:
  - `https://example.com/tomb-of-fallen-gods-season-3-episode-30-subtitle-indonesia/`

## DOM Assumptions
- Series title and URL from `.det h2 a`
- Total episodes from `.det span` pattern `- 30 / 52`
- Episode list from `.episodelist ul li`
- Current episode via `li.selected` or URL match

## Data Storage
Backend sync via Cloudflare Worker + D1, with local cache in `storage.local`.

## Files
- `manifest.json` - Extension manifest (MV2)
- `content.js` - DOM parsing, storage, UI injection
- `content.css` - Styles for injected UI
- `worker.js` - Cloudflare Worker API
- `schema.sql` - D1 schema
- `wrangler.toml` - Worker config

## Troubleshooting
- If buttons don’t appear, the site’s DOM may have changed. Update selectors in `content.js`.
- If data resets, confirm the extension has `storage` permission and is loaded correctly.
