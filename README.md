# FSTouchCompanion

A companion app that turns your tablet or phone into an Electronic Flight Bag (EFB) for flight simulators. It connects to **Microsoft Flight Simulator (MSFS)** or **X-Plane 12** running on your PC and streams real-time flight data to a web-based interface you can access from any device on your local network.

## Features

- **Radio Management** – View and control COM1/COM2 active and standby frequencies, with a keypad for frequency entry
- **ATC Frequency Selector** – Quickly tune nearby ATC frequencies
- **Checklists** – Aircraft-specific checklists (A320, B737, B767, C150, TBM850, and more)
- **Flight Plan** – SimBrief integration for importing flight plans
- **Weather** – Weather information display
- **Multi-device** – Access from any device with a browser on your local network

## Architecture

| Component | Tech | Purpose |
|-----------|------|---------|
| `fsConnect/` | Go (Wails) | Desktop app that connects to the flight simulator via SimConnect (MSFS) or UDP (X-Plane 12) and exposes data over WebSocket |
| `svelte/` | SvelteKit 5, Skeleton UI, Tailwind CSS | Web-based EFB interface served to tablets/phones |

## Prerequisites

- [Go](https://go.dev/) 1.21+
- [Node.js](https://nodejs.org/) 18+
- [Wails](https://wails.io/) v2 (for the desktop connector)
- Docker & Docker Compose (for production deployment)

## Getting Started

### Desktop Connector (fsConnect)

```sh
cd fsConnect
wails dev
```

This launches the connector app on your PC. It will connect to your running flight simulator and start a WebSocket server.

### Web EFB (svelte)

```sh
cd svelte
npm install
npm run dev -- --host
```

Open the displayed URL on your tablet/phone (e.g. `http://<your-pc-ip>:5173`).

### Production (Docker)

```sh
docker compose up --build -d
```

The web interface will be available on port `5001`.

## Supported Simulators

- Microsoft Flight Simulator 2020/2024 (via SimConnect)
- X-Plane 12 (via UDP)

