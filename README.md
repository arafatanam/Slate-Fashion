# Slate Fashion

Marketing site and onboarding flow for Slate, an AI-powered modest fashion discovery product.

| Route | Folder | What it is |
| --- | --- | --- |
| `/` | `landing/` | Landing page |
| `/onboarding/` | `onboarding/` | 16-screen onboarding flow |

## Stack

Static HTML, CSS and vanilla JavaScript. There are no dependencies and no build step. Fonts (Instrument Sans, Instrument Serif, Outfit) load from Google Fonts.

## Structure

```
landing/
  index.html
  css/styles.css
  js/main.js
  assets/              WebP images used by the page
    png assets/        4x PNG masters from Figma
onboarding/
  index.html
  css/styles.css
  js/main.js
  assets/              WebP images used by the page
    png assets/        4x PNG masters from Figma
  frames/              Figma screen exports, for design reference
vercel.json            Routing
.vercelignore          Keeps PNG masters and frames out of deployments
```

## Run locally

Open `landing/index.html` or `onboarding/index.html` in a browser, or serve the repo root:

```
npx serve .
```

Then visit `/landing/` and `/onboarding/`. The `/` route only exists on Vercel, because it comes from `vercel.json`.

## Images

Pages only use the WebP files. To change an image, export it from Figma at 4x into `png assets/`, convert it to WebP under the same name in the parent `assets/` folder, and keep it at about 2x its display size or smaller.

`onboarding/assets/checker.webp` has no PNG master. It is a placeholder for product photos.

## Onboarding

All screens live in `onboarding/index.html`, and `onboarding/js/main.js` shows one at a time. The URL hash tracks the current screen, so `#5` opens screen 5.

Answers are held in memory only, and Subscribe and Sign In are not connected to a backend yet.

## Deployment

Hosted on Vercel as one project with the Other framework preset, the repo root as the root directory, and no build command. `vercel.json` serves `landing/` at `/`, and `onboarding/` is served at `/onboarding/` from its own folder.
