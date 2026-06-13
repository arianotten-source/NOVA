# N.O.V.A. Deployment Guide

## Overzicht

| Platform | Doel | Build commando |
|----------|------|----------------|
| **Vercel** | Web app (mobiel/tablet/desktop) | `npm run build:web` |
| **Electron** | Desktop (Linux/Windows) | `npm run build` |
| **GitHub** | Broncode & CI |

> Vercel host alleen de React frontend. Electron backend, Sensor API en lokale JSON-opslag draaien **niet** op Vercel — data wordt opgeslagen in `localStorage` in de browser.

---

## 1. GitHub repository

### Nieuw repository aanmaken

```bash
cd /path/to/N.O.V.A.
git init
git add .
git commit -m "Initial commit: N.O.V.A. v1 web + desktop"
```

Maak een leeg repository op GitHub (zonder README), daarna:

```bash
git branch -M main
git remote add origin https://github.com/JOUW-GEBRUIKERSNAAM/nova.git
git push -u origin main
```

Of met GitHub CLI:

```bash
gh repo create nova --public --source=. --remote=origin --push
```

---

## 2. Vercel import

1. Ga naar [vercel.com/new](https://vercel.com/new)
2. Importeer je GitHub repository
3. Vercel detecteert automatisch:
   - **Framework:** Vite
   - **Build Command:** `npm run build:web`
   - **Output Directory:** `dist`
4. Klik **Deploy**

Configuratie staat in `vercel.json` — handmatige instellingen zijn optioneel.

---

## 3. Environment variables

| Variabele | Vercel | Beschrijving |
|-----------|--------|--------------|
| `VERCEL` | Auto | Door Vercel gezet; activeert `base: '/'` in Vite |
| `VITE_SENSOR_API_URL` | Optioneel | Toekomst: externe Sensor API URL |

Voor de huidige V1 zijn **geen** environment variables verplicht.

Toevoegen in Vercel: **Project → Settings → Environment Variables**

---

## 4. SPA routing (React Router)

Directe URLs werken via `vercel.json` rewrites:

- `/chat`
- `/notes`
- `/tasks`
- `/agenda`
- `/sensors`
- `/settings`
- `/system`
- `/files`

Pagina verversen op deze routes laadt `index.html` — geen 404.

---

## 5. Custom domain

1. Vercel → **Project → Settings → Domains**
2. Voeg domein toe: `nova.jouwdomein.nl`
3. Configureer DNS bij je provider:

```
Type: CNAME
Name: nova
Value: cname.vercel-dns.com
```

4. Wacht op SSL (automatisch via Vercel)

---

## 6. Lokale productie-test

```bash
npm run build:web
VERCEL=1 npx vite preview --host 0.0.0.0 --port 4173
```

Test routes: `http://localhost:4173/chat`

---

## 7. Responsive & dark theme

- Breakpoints: mobile `<768px`, tablet `768–1199px`, desktop `1200px+`
- Donker thema via Tailwind `nova-*` kleuren
- Mobile: bottom navigation + hamburger menu
- Getest op Android, tablet, iPad viewport
