# Worker API Test (curl)

Set your token and base URL:

```bash
export API_BASE="https://donghua.mushonnip.id"
export API_TOKEN="YOUR_TOKEN_HERE"
```

If you just deployed the Worker, make sure the schema is applied to the remote D1 DB:

```bash
wrangler d1 execute anichin_tracker --file schema.sql --remote
```

## Health Check (Unauthorized)

```bash
curl -i "$API_BASE/state"
```

Expected: `401 Unauthorized`

## Get All State

```bash
curl -i \
  -H "Authorization: $API_TOKEN" \
  "$API_BASE/state"
```

Expected: `200 OK` with JSON `{ "records": [] }` or existing records.

## Upsert Single Record

```bash
curl -i \
  -X PUT \
  -H "Authorization: $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tomb of Fallen Gods Season 3",
    "seriesUrl": "/tomb-of-fallen-gods-season-3/",
    "isFavorite": true,
    "completedEpisodes": [
      "/tomb-of-fallen-gods-season-3-episode-01-subtitle-indonesia/",
      "/tomb-of-fallen-gods-season-3-episode-02-subtitle-indonesia/"
    ],
    "totalEpisodes": 52,
    "lastUpdated": 1708450000000
  }' \
  "$API_BASE/state"
```

Expected: `200 OK` with `{ "ok": true }`

## Fetch Single Record

```bash
curl -i \
  -H "Authorization: $API_TOKEN" \
  "$API_BASE/state?seriesUrl=/tomb-of-fallen-gods-season-3/"
```

Expected: `200 OK` with `{ "record": { ... } }`

## Batch Sync

```bash
curl -i \
  -X POST \
  -H "Authorization: $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "series": [
      {
        "title": "Tomb of Fallen Gods Season 3",
        "seriesUrl": "/tomb-of-fallen-gods-season-3/",
        "isFavorite": true,
        "completedEpisodes": [
          "/tomb-of-fallen-gods-season-3-episode-01-subtitle-indonesia/"
        ],
        "totalEpisodes": 52,
        "lastUpdated": 1708450000000
      },
      {
        "title": "Another Series",
        "seriesUrl": "/another-series/",
        "isFavorite": false,
        "completedEpisodes": [],
        "totalEpisodes": 12,
        "lastUpdated": 1708450000000
      }
    ]
  }' \
  "$API_BASE/sync"
```

Expected: `200 OK` with `{ "ok": true, "count": 2 }`

## Forbidden (Wrong Token)

```bash
curl -i \
  -H "Authorization: WRONG" \
  "$API_BASE/state"
```

Expected: `403 Forbidden`
