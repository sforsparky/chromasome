# Chromasome

A color palette generator by [In My DNA](https://inmydna.com), live at [chromasome.inmydna.com](https://chromasome.inmydna.com).

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

The app is a static site hosted on Netlify at **chromasome.inmydna.com**. `netlify.toml` holds the build settings (`npm run build`, publish `dist/`, Node 22); every push to `main` deploys automatically once the Netlify project is linked to this repo.

The build also accepts a base path for hosting under a sub-directory. It must start and end with `/`:

| Target | Command |
|---|---|
| Local dev | `npm run dev` (base `/`) |
| Netlify (domain root) | `npm run build` |
| A sub-directory such as `/chromasome/` | `VITE_BASE_PATH=/chromasome/ npm run build`, then upload `dist/` to that directory |

Because the palette is in the URL hash, no server-side rewrite rules are needed on any host.

`.github/workflows/ci.yml` runs lint, tests and a build on every push to `main` and on every pull request.

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
