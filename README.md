Free movies hosted by me 
Soon PS4 app will be made and we can fuck netflix out the window


## Install OnlyFlix as a home-screen app (PWA)

The site includes a web app manifest, standalone display mode, app icons, and a service worker for caching the static app shell. Deploy the site over HTTPS (Cloudflare Pages provides HTTPS).

- **iPhone/iPad:** open the deployed site in Safari → Share → Add to Home Screen → Add. If the “Open as Web App” option appears, leave it enabled. Launch OnlyFlix from the new home-screen icon.
- **Android:** open the site in Chrome → browser menu → Install app (or Add to Home screen).

On iOS, the Share → Add to Home Screen step is still required; a website cannot silently install itself. The installed version opens without the normal Safari address bar. Live catalogue/API calls still require an internet connection; the service worker caches only the app shell.
