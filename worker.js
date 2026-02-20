export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Authorization,Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const auth = request.headers.get("Authorization");
    if (!auth) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    if (env.API_TOKEN && auth !== env.API_TOKEN) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === "GET" && path === "/state") {
        const seriesUrl = url.searchParams.get("seriesUrl");
        if (seriesUrl) {
          const row = await env.DB.prepare(
            "SELECT * FROM series_state WHERE auth_token = ? AND series_url = ?"
          )
            .bind(auth, seriesUrl)
            .first();
          const record = row ? deserialize(row) : null;
          return json({ record }, corsHeaders);
        }

        const rows = await env.DB.prepare(
          "SELECT * FROM series_state WHERE auth_token = ?"
        )
          .bind(auth)
          .all();
        const records = (rows.results || []).map(deserialize);
        return json({ records }, corsHeaders);
      }

      if (request.method === "PUT" && path === "/state") {
        const record = await request.json();
        validateRecord(record);
        await upsertRecord(env.DB, auth, record);
        return json({ ok: true }, corsHeaders);
      }

      if (request.method === "POST" && path === "/sync") {
        const body = await request.json();
        const series = Array.isArray(body.series) ? body.series : [];
        for (const record of series) {
          validateRecord(record);
          await upsertRecord(env.DB, auth, record);
        }
        return json({ ok: true, count: series.length }, corsHeaders);
      }

      return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response("Bad Request", { status: 400, headers: corsHeaders });
    }
  }
};

function validateRecord(record) {
  if (!record || typeof record.seriesUrl !== "string") {
    throw new Error("Invalid record");
  }
}

function deserialize(row) {
  return {
    title: row.title || "",
    seriesUrl: row.series_url,
    isFavorite: !!row.is_favorite,
    completedEpisodes: row.completed_episodes ? JSON.parse(row.completed_episodes) : [],
    totalEpisodes: row.total_episodes || null,
    lastUpdated: row.last_updated || null
  };
}

async function upsertRecord(db, auth, record) {
  const completedJson = JSON.stringify(record.completedEpisodes || []);
  await db
    .prepare(
      "INSERT INTO series_state (auth_token, series_url, title, is_favorite, completed_episodes, total_episodes, last_updated, updated_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s','now')) " +
        "ON CONFLICT(auth_token, series_url) DO UPDATE SET " +
        "title = excluded.title, " +
        "is_favorite = excluded.is_favorite, " +
        "completed_episodes = excluded.completed_episodes, " +
        "total_episodes = excluded.total_episodes, " +
        "last_updated = excluded.last_updated, " +
        "updated_at = strftime('%s','now')"
    )
    .bind(
      auth,
      record.seriesUrl,
      record.title || "",
      record.isFavorite ? 1 : 0,
      completedJson,
      record.totalEpisodes || null,
      record.lastUpdated || Date.now()
    )
    .run();
}

function json(payload, headers) {
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json", ...headers }
  });
}
