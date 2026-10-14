# One Piece Hiatus Chart

A minimal, week-by-week hiatus chart for the **One Piece** manga — inspired by the
[HxH hiatus chart](https://hiatus-hiatus.github.io). Each row is a year, each column
an ISO week. Filled cells are weeks a chapter was published; blank cells are breaks
and hiatuses.

Built with **Vite + React + TypeScript + Tailwind + shadcn/ui**. Chapter release
dates are scraped from the [One Piece Wiki](https://onepiece.fandom.com) and the site
auto-updates weekly via GitHub Actions.

## How it works

- **Data**: `public/data/chapters.json` — one record per chapter
  (`number`, `title`, `volume`, `releaseDate`, `wsjIssue`).
- **Scraper**: `scripts/scrape.ts` queries the Fandom MediaWiki parse API
  (`action=parse&prop=text`) for each `Chapter_N` page and reads the "Release Date"
  from the rendered infobox. A nonexistent page (`missingtitle`) marks the end.
- **Chart**: `src/lib/chart.ts` maps each release date to its ISO week and builds a
  year x week grid. Weeks with no chapter inside the active span render as a hiatus.

## Local development

```bash
npm install
npm run dev          # start the dev server
```

## Scraping

```bash
npm run scrape       # incremental — adds newly released chapters only
npm run scrape:full  # rebuild chapters.json from chapter 1
```

The scraper checkpoints every 50 chapters, so a long full run can be safely resumed
(just run `npm run scrape` again and it continues after the last saved chapter).

## Build

```bash
npm run build        # type-check + production build into dist/
npm run preview      # preview the production build
```

## Deployment (GitHub Pages)

The workflow in `.github/workflows/update.yml`:

1. **Weekly (Mondays 06:00 UTC)** and on manual dispatch: runs `npm run scrape`.
   If a new chapter exists, it commits the updated `chapters.json`; if not, nothing
   changes and those weeks stay blank on the chart.
2. Builds the site and deploys it to GitHub Pages.

### One-time setup

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. The workflow sets `VITE_BASE` to `/<repo-name>/` automatically for project pages.
   If you use a custom domain or a `user.github.io` repo, change `VITE_BASE` to `/`.

## Data source & attribution

Chapter data © the [One Piece Wiki](https://onepiece.fandom.com) community
(CC BY-SA). This project is an unofficial fan-made chart.
