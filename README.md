# Chromasome

**Color, in my DNA.** A color palette generator by [In My DNA](https://inmydna.com).

Press space to mutate a new strand of colors, lock the ones you want to keep, adjust any color, and share the palette with a single URL. Export as CSS, SCSS, Tailwind, JSON or PNG, or extract a palette from any image. Everything runs in the browser; there is no backend.

## Features

- **Mutate** (space bar) generates a palette using a random color-harmony rule (analogous, complementary, split-complementary, triadic, tetradic, monochrome) with lightness spread so neighbours stay distinct.
- **Lock** a color and it survives every mutation. Mutations build around the hue of the first locked color.
- **Adjust** any color with hex input, a native color picker, or hue/saturation/lightness sliders.
- **Add, remove and reorder** columns (2 to 10) with the + buttons, arrows, or drag and drop.
- **Undo / redo** with Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z.
- **Color code**: the palette lives in the URL hash, so the link *is* the palette:
  `https://inmydna.com/chromasome/#/264653-2a9d8f-e9c46a-f4a261-e76f51`
- **Export** as CSS custom properties, SCSS variables, a Tailwind config snippet, JSON, or a 1600×900 PNG.
- **Extract DNA**: drop in an image and get its five dominant colors (median-cut quantization on a downscaled canvas, all client-side).

## Development

Requires Node 22.

```sh
npm install
npm run dev        # http://localhost:5173/
npm test           # vitest
npm run lint       # oxlint
npm run build      # tsc + vite build -> dist/
npm run preview    # serve dist/
```

`.npmrc` sets `legacy-peer-deps=true`; npm 10's peer resolver fails on vitest's optional peer set without it.

## Deploying

The app is a static site. The only build-time setting is the base path, which must start and end with `/`:

| Target | Command |
|---|---|
| Local dev | `npm run dev` (base `/`) |
| inmydna.com/chromasome | `VITE_BASE_PATH=/chromasome/ npm run build`, then upload `dist/` to the site's `/chromasome/` directory |
| GitHub Pages | automatic on push to `main` via `.github/workflows/deploy.yml` (base `/<repo-name>/`) |

Because the palette is in the URL hash, no server-side rewrite rules are needed on any host.

For GitHub Pages, set **Settings → Pages → Source** to "GitHub Actions" once.

## Project layout

```
src/
  copy.ts            brand vocabulary (Mutate, strand, Extract DNA, Color code…)
  lib/color/         hex/rgb/hsl conversion, WCAG contrast, color names, palette generation
  lib/extract/       median-cut quantization and image → palette
  lib/export/        CSS/SCSS/Tailwind/JSON strings, PNG rendering, clipboard helpers
  lib/url/           palette ⇄ URL hash codec
  state/             reducer with undo/redo, provider, URL sync, keyboard shortcuts
  components/        header, palette board, color column, adjust panel, dialogs, toolbar
```
