# Vokabeltrainer (React)

A React version of the Orange Line vocab trainer with the same UX as the vanilla prototype.

## Lokal entwickeln
- `cd react-app`
- `npm ci`
- `npm run dev` (Vite auf Port 5173)

## Build
- `npm run build` → schreibt nach `react-app/dist`
- Optionaler Base-Pfad: `VITE_BASE_PATH=/mein/pfad npm run build`

## Deployment auf GitHub Pages
Dieser Ordner wird per Workflow `/.github/workflows/deploy.yml` als GitHub Page gebaut und veröffentlicht.

So funktioniert es:
- Pages-Quelle in den Repo-Einstellungen auf **GitHub Actions** stellen.
- Jede Push auf `main` (oder manuell) baut `react-app` mit `VITE_BASE_PATH="/<repo-name>/"`, lädt `dist` als Artifact hoch und deployed mit `actions/deploy-pages`.
- Der Vite-Base-Pfad wird damit automatisch korrekt gesetzt: `https://<user>.github.io/<repo>/`.

Checkliste bei Fehlern:
- Läuft der Build lokal? (`npm run build`)
- Ist der Pages-Branch/Workflow in den Repo-Settings aktiviert?
- Stimmen die Repo-Berechtigungen für Pages (write) im Workflow?
