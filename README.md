# Chromasome

A color palette generator by [In My DNA](https://inmydna.com), live at [chromasome.inmydna.com](https://chromasome.inmydna.com).

Press space to mutate a new strand of colors, lock the ones you want to keep, adjust any color, and share the palette with a single URL. Export as CSS, SCSS, Tailwind, JSON or PNG, or extract a palette from any image. Everything runs in the browser; there is no backend.

## Features

- **Mutate** (space bar) generates a palette using a random color-harmony rule (analogous, complementary, split-complementary, triadic, tetradic, monochrome). Each strand has one loud color and keeps the rest quiet, spread across dark, middle and light (measured perceptually in OKLCH and CIE L\*). About one mutation in six comes out calm: no loud color, one clearly darker.
- **Lock** a color and it survives every mutation. Mutations take their hue from a locked color (greys have none to give); a locked loud color stays the only loud one, and new colors keep their distance from a locked color's lightness.
- **Adjust** any color with hex input, a native color picker, or hue/saturation/lightness sliders.
- **Add, remove and reorder** columns (2 to 10) with the + buttons, arrows, or drag and drop.
- **Undo / redo** with Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z.
- **Color code**: the palette lives in the URL hash, so the link *is* the palette:
  `https://inmydna.com/chromasome/#/264653-2a9d8f-e9c46a-f4a261-e76f51`
- **Palette checks** pop up when you hover the *Size board by role* button (or switch it on, on phones): a live panel that scores the strand against three rules: one loud, the rest quiet; dark, middle and light; the loud color takes the least space. It shows a 60/30/10 preview and a small mock page. The checks are adapted from Alena Song's [free color lesson](https://asongstudio.com/courses/free-color-lesson).
- **Size board by role** resizes the columns to their 60/30/10 shares and labels each color's role.
- **Squint** shows every color as its greyscale value, the quick test for whether dark, middle and light hold up.
- **Export** as CSS custom properties, SCSS variables, a Tailwind config snippet, JSON, or a 1600×900 PNG (equal columns or 60·30·10). CSS, SCSS and Tailwind add role aliases after the numbered colors (`--color-bg`, `$color-bg`, `strand-bg`, plus `second` and `accent`); JSON gives each color its `role` and `share`.
- **Extract from photo**: drop in an image and get its five dominant colors (median-cut quantization on a downscaled canvas, all client-side).

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
  copy.ts            brand vocabulary (Mutate, strand, Color code…)
  lib/color/         hex/rgb/hsl and OKLCH conversion, WCAG contrast, color names, roles and checks, palette generation
  lib/extract/       median-cut quantization and image → palette
  lib/export/        CSS/SCSS/Tailwind/JSON strings, PNG rendering, clipboard helpers
  lib/url/           palette ⇄ URL hash codec
  state/             reducer with undo/redo, provider, URL sync, keyboard shortcuts
  components/        header, palette board, color column, adjust panel, checks panel, dialogs, toolbar
```
