# N.O.V.A. — Neural Observation & Voice Assistant

Persoonlijke AI-assistent desktop-app voor Ubuntu/Linux.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, TailwindCSS
- **Desktop:** Electron
- **Data:** Lokale JSON opslag
- **Voice:** Web Speech API

## Starten

```bash
# Dependencies installeren
npm install

# Development (browser)
npm run dev

# Development (Electron)
npm run electron:dev

# Productie build
npm run build
npm start
```

## Projectstructuur

```
N.O.V.A./
├── docs/           Documentatie
├── assets/         Icons, sounds, avatars, wallpapers
├── data/           Lokale JSON data
├── backend/        API, services, storage
├── frontend/       React UI
├── electron/       Electron main process
├── scripts/        Build scripts
└── exports/        Build output
```

## Functies (V1)

- Dashboard met tijd, snelkoppelingen en systeemstatus
- Chat met tekst- en spraakinvoer
- Notities (CRUD, zoeken)
- Taken (prioriteit, status)
- Agenda (kalender, afspraken, herinneringen)
- Sensoren (mock ESP32 data)
- Systeemstatus (CPU, RAM, opslag, netwerk)
- Bestandsbrowser (data map)
- Instellingen

## Toekomstige uitbreidingen

Architectuur is voorbereid voor: OpenAI API, lokale LLM, ESP32, camera's, sensoren, robotlichaam, Home Assistant.
