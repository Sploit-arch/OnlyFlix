const API_BASE = "https://api.themoviedb.org/3";

export async function onRequest({ request, env, params }) {
  const key = env.TMDB_API_KEY;
  if (!key) return Response.json({ error: "TMDB is not configured. Add TMDB_API_KEY in Cloudflare Pages settings." }, { status: 503 });

  const segments = Array.isArray(params.path) ? params.path : (params.path ? [params.path] : []);
  const pathname = segments.map(encodeURIComponent).join("/");
  if (!pathname) return Response.json({ error: "Missing TMDB endpoint." }, { status: 400 });

  const incoming = new URL(request.url);
  const target = new URL(`${API_BASE}/${pathname}`);
  for (const [name, value] of incoming.searchParams) {
    if (name !== "api_key") target.searchParams.set(name, value);
  }
  target.searchParams.set("api_key", key);

  const upstream = await fetch(target.toString(), { headers: { Accept: "application/json" } });
  const headers = new Headers({
    "Content-Type": upstream.headers.get("Content-Type") || "application/json",
    "Cache-Control": "public, max-age=300, s-maxage=900",
    "X-Content-Type-Options": "nosniff"
  });
  return new Response(upstream.body, { status: upstream.status, headers });
}
