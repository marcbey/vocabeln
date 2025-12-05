# GitHub Pages

The React app is wired to ship to GitHub Pages via `.github/workflows/deploy-pages.yml`.

- Pages should be set to the **GitHub Actions** source in the repository settings.
- Every push to `main` (or a manual run) installs deps, builds in `react-app`, and publishes `react-app/dist` to Pages.
- The Vite base path is inferred from the repo name when running in Actions, so assets resolve at `https://<user>.github.io/<repo>/`. You can override it with `VITE_BASE_PATH=/custom/` if needed.
- Local dev is unchanged: `cd react-app && npm ci && npm run dev`.

If you want to test the Pages build locally, run `VITE_BASE_PATH=/$(basename $(git rev-parse --show-toplevel))/ npm run build` from `react-app` and open `dist/index.html`.
