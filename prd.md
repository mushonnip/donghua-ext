# Product Requirements Document (PRD)

## Overview
Build a Firefox (Manifest V2) browser extension for `anichin.moe` that lets users:
- Favorite an anime series on both the series detail page and the watch page.
- Mark episodes completed from the watch page.
- Mark a range of episodes completed from the watch page (e.g., 1–9).
- View simple progress as `completed/total` when available.

The extension does not use any external API; it relies on DOM selectors (class/id) to detect the current series and episode list. All data is stored locally in the browser.

## Goals
- Enable users to favorite shows and track watched episodes without external accounts.
- Provide a lightweight, in-page UI with minimal friction.

## Success Metrics
- Weekly DAU/WAU usage of “favorite” and “mark completed” actions.

## Scope (MVP)
- Target site: `https://anichin.moe/*`
- Pages:
  - Series detail page: `https://anichin.moe/tomb-of-fallen-gods-season-3/`
  - Episode watch page: `https://anichin.moe/tomb-of-fallen-gods-season-3-episode-30-subtitle-indonesia/`
- UI:
  - Favorite button on series detail page.
  - Favorite button on watch page.
  - “Completed” controls for episodes inside the watch page episode list.
  - Progress display (`completed/total`) on watch page.
- Storage:
  - Local-only browser storage.
  - No account creation, no sync, no external services.

## Non-Goals
- Cross-device or cross-site sync.
- External account integrations (MAL/Anilist).
- Automatic watched detection (user must click).
- Recommendations or discovery features.

## DOM Detection Strategy (No API)
The extension must parse information from the page DOM. Selectors are heuristic and may change if the site markup changes.

### Series Detail Detection
Use the following pattern to identify the series and total episodes:

```html
<div class="det">
  <h2><a href="/tomb-of-fallen-gods-season-3/">Tomb of Fallen Gods Season 3</a></h2>
  <span><i>Ongoing</i> - 30 / 52</span>
</div>
```

Heuristic selectors:
- Series link: `.det h2 a`
  - `textContent` -> series title
  - `href` -> series URL (normalize to absolute)
- Total episode count: `.det span`
  - Parse `- 30 / 52` using `/\s(\d+)\s*\/\s*(\d+)/` and store `total` if available.
- Fallbacks:
  - If `.det h2 a` is missing, use `<title>` as series title and current URL as series URL.

### Watch Page Episode List Detection
Episode list exists only on the watch page and is structured under `.episodelist`:

```html
<div class="episodelist">
  <ul>
    <li data-id="53231" class="selected" selected="selected">
      <a href="/tomb-of-fallen-gods-season-3-episode-30-subtitle-indonesia/" itemprop="url">
        <div class="playinfo">
          <h3>Tomb of Fallen Gods Season 3 Episode 30 Subtitle Indonesia</h3>
          <span>Eps 30 - February 20, 2026</span>
        </div>
      </a>
    </li>
  </ul>
</div>
```

Heuristic selectors:
- Episode list container: `.episodelist ul`
- Episode items: `.episodelist ul li`
- Episode URL: `li a[href]`
- Episode number: parse from `.playinfo span` with `/Eps\s+(\d+)/`
- Current episode: `li.selected` (fallback: match `location.pathname` to `a[href]`)

### Favorite Button Placement
- Series detail page: place near `.det h2 a`.
- Watch page: place near `.det h2 a` if present; otherwise place above the `.episodelist` container.

## Data Model (Local Storage)
Store a single record per series, keyed by normalized series URL.

Fields:
- `title`: string
- `seriesUrl`: string
- `isFavorite`: boolean
- `completedEpisodes`: array of episode URLs (primary ID)
- `totalEpisodes`: number (optional, from series detail or watch page)
- `lastUpdated`: timestamp

## UX Flows
1. User opens a series detail page.
2. Extension injects Favorite toggle near the title.
3. User opens a watch page.
4. Extension injects Favorite toggle and “Completed” controls into episode list items.
5. User marks episodes completed; progress count updates and persists locally.

## Permissions (Firefox MV2)
- `storage`
- Host permission: `https://anichin.moe/*`
- Content scripts on series detail and watch pages.

## Risks and Edge Cases
- DOM changes may break selectors; note ongoing maintenance requirement.
- Missing `.det` or `.episodelist` should result in no injected controls (fail gracefully).
- Episode numbering may be inconsistent; episode URL is the source of truth.

## Acceptance Criteria and Test Scenarios
1. Favorite button appears on series detail page and toggles state; persists after reload.
2. Favorite button appears on watch page and reflects same series favorite state.
3. Completed controls appear for each episode in `.episodelist`.
4. Marking an episode completed persists across reload and browser restart.
5. Progress count shows `completed/total` when `total` is parseable.
6. If `.det` or `.episodelist` is missing, the extension does not throw errors and injects no UI.
7. Range action marks multiple episodes at once (e.g., 1–9) and persists.

## Open Questions
- None for MVP. Selector stability is the primary operational risk.
