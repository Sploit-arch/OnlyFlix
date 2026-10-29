# OnlyFlix Movie Hub — GitHub Pages

Responsive Netflix-inspired static website with live catalogue browsing, title search, movie details, watchlist, local preferences, and a playback modal.

## Features
- Responsive cinematic layout and poster rows.
- Live latest movie and TV feeds from VidAPI: `https://vidapi.ru/movies/latest/page-N.json` and `/tvshows/latest/page-N.json`.
- Search over recent catalogue pages without a key.
- Optional TMDB integration for broader title search and trending/popular discovery.
- Watchlist and preferences saved in this browser's localStorage.
- Playback selects a direct MP4/HLS URL first only when a provider actually supplies one; otherwise uses the catalogue's embed URL if allowed by the preference.

## Playback limitation
The current VidAPI catalogue feed documents `embed_url`, not a guaranteed direct MP4/HLS stream URL. This project does **not** scrape or extract hidden media URLs from embed pages. Therefore playback will normally use the provider's embedded player. Direct HTML5 playback is selected only if a supported provider returns a URL in a `direct_url`, `stream_url`, or `video_url` field ending in `.mp4` or `.m3u8`. An embed may refuse to load on a different domain or require provider access/whitelisting.

## Enable full catalogue search (optional)
1. Request a TMDB API key for your use case: https://developer.themoviedb.org/docs/getting-started
2. Put the v3 API key in `config.js` as `tmdbApiKey: "YOUR_KEY"`.
3. Commit and push. **This key is public in a GitHub Pages site**; use a key intended for client-side access and follow TMDB terms/attribution. To keep credentials private, a backend/proxy is required and GitHub Pages alone cannot provide one.

## Publish on GitHub Pages
1. Extract this ZIP.
2. Create a repository (for example `onlyflix-movie-hub`).
3. Upload the contents of this folder to the repository root.
4. Open repository **Settings → Pages**.
5. Select **Deploy from a branch**, branch `main`, folder `/(root)`, then Save.
6. Wait for GitHub to publish the URL.

For local testing run `py -m http.server 8000` in this folder and open `http://localhost:8000`. Opening the HTML directly as `file://` may block API requests.

## Files
- `index.html` — page structure and dialogs
- `styles.css` — responsive design
- `app.js` — catalogue, search, watchlist and playback logic
- `config.js` — public configuration
- `assets/` — logo mark and fallback poster

No build step is required. Catalogue availability depends on the third-party service and browser cross-origin access. Watchlist data is local to each browser/device and does not sync.
