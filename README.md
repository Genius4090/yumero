# Yumero frontend

Customer site + admin panel (`/dashboard`, opened automatically after an admin logs in) for the Yumero food delivery service. React 19, Vite, TypeScript, Tailwind 4, React Query.

The API lives in the separate **yumero-backend** repo, which also contains the production Docker Compose stack (Postgres + API + Caddy) and the deploy guide. In production this repo is built by its `Dockerfile` into a Caddy image; the backend's `docker-compose.yml` expects it checked out next to the backend folder (`../yumero-frontend`).

## Local development

```bash
cp .env.example .env.local   # optional: Yandex Maps key
npm install
npm run dev                  # http://localhost:5173
```

The dev server proxies `/api` and `/uploads` to `http://localhost:4000`, so start the backend first (`pnpm dev` in yumero-backend with `OTP_DEV_MODE=true`; verification code `000000`).

Scripts: `npm run build` (typecheck + production build), `npm run lint`, `npm run preview`.

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_YANDEX_MAPS_API_KEY` | Yandex Maps key for the address picker; empty = OpenStreetMap/Leaflet fallback |
| `VITE_API_URL` | Backend origin. Leave empty for same-origin (production and the dev proxy) |

## Structure

```
src/api/hooks.ts        React Query hooks for the public API
src/admin/              admin panel (layout, pages, admin API hooks)
src/lib/api.ts          fetch wrapper: bearer token, refresh-on-401, typed ApiError
src/lib/localized.ts    pickText(): choose ru/en/uz from API texts
src/context/            auth, cart (local), addresses, orders, settings
src/i18n/               ru / en / uz dictionaries (typed keys)
```
