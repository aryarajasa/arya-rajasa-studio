# arya rajasa studio

Portfolio site. React + Vite, deployed to GitHub Pages by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`.

## Run locally

```bash
npm install
npm run dev
```

The site runs at http://localhost:3000/arya-rajasa-studio/ (the path suffix is
the GitHub Pages base — it is part of the URL in dev too).

## Editing projects

All site content lives in [`src/content/site.json`](src/content/site.json).
Nothing user-facing is hardcoded in components.

Projects are edited through a visual editor that runs **only on the dev server**:

```bash
npm run dev
```

then open **http://localhost:3000/arya-rajasa-studio/admin**

From there you can:

- **add, delete and reorder projects** — the sidebar order is the order they
  appear in the homepage carousel
- **edit the carousel card** — name, the grey `details` caption, and the thumbnail
- **edit the case study page** — intro, meta (company / services / industry / year),
  hero image, and the body
- **build the body from blocks** — add, reorder and delete `text`, `full image`
  and `image grid` blocks in any sequence

Changes are held in the browser until you press **save** (or `Ctrl`/`Cmd`+`S`),
which writes `src/content/site.json` to disk. Nothing is published yet:

```bash
git add -A && git commit -m "Update projects" && git push
```

The deploy workflow takes it from there.

### Images

Dropping or selecting an image in the editor uploads it, converts it to WebP,
caps its long edge at 2000px and writes it to `public/images/`. A 7MB PNG
typically lands around 200KB. The field also accepts a pasted URL if you would
rather hotlink than commit the file.

### URLs and slugs

Each project has a `slug` that becomes its page URL (`/project/<slug>`). The
slug follows the project name until you edit it by hand, after which it stays
put — so renaming a project later won't silently break a link you've shared.
The editor blocks duplicate and malformed slugs, and the dev server refuses to
write a `site.json` that fails validation, so a bad edit can't break the build.

### Why the editor is dev-only

The published site is a static bundle with no backend, so there is nothing to
authenticate and no write endpoint to secure. The editor talks to middleware in
[`src/admin/plugin.ts`](src/admin/plugin.ts) that is registered with
`apply: 'serve'`, and the UI is behind an `import.meta.env.DEV` branch that
Rollup drops at build time. Neither the editor nor its API exists in `dist/`.

## Layout

```
src/
  admin/       dev-only project editor (never shipped)
  components/  carousel, cursor, loader
  content/     site.json + typed accessors
  pages/       home, story, playbook, project
```
