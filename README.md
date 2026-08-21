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


## Contributing

Every PR is **squash-merged**, and the squash commit message is the **PR title**. That single
title is therefore the only string release-please ever reads, and the only one that has to be
a [Conventional Commit](https://www.conventionalcommits.org/) — the **PR Title** check enforces
it. Commits *inside* your branch are yours: `wip`, `fixup`, `asdf`, whatever helps you save
work. None of them reach `main` or the changelog, so there is no commit-message hook to install.

Title format:

```
<type>(<optional scope>): <description>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
`chore`, `revert`. Append `!` for a breaking change (e.g. `feat!:`). Because the squash body is
the **PR description**, that is also where a `BREAKING CHANGE:` footer goes. Examples:

```
feat(companion): add X-Plane 12 autopilot bindings
fix(web): keep the EFB awake on reconnect
chore(deps): bump wails
```

> Only `feat`, `fix`, and breaking changes bump a version; the rest don't trigger a release.
> release-please assigns a change to the `web` or `companion` component by the paths it touches
> (`svelte/` vs `fsConnect/`), and each gets its own version, changelog and tag — `web-vX.Y.Z`
> publishes the container image, `companion-vX.Y.Z` builds and attaches the Windows binary.
>
> A PR that does two unrelated things collapses into one changelog entry under one type. The fix
> is to split the PR.

The checks on a PR are **web** (builds the container image from `Dockerfile.svelte.prod`) and
**companion** (`gofmt`, `go vet`, `go test`, then the full `wails build` on Windows). Both build
what actually ships, so a bad dependency bump fails here rather than at release time.
