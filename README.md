# TAG — Security and Resilience (static site)

Plain HTML, CSS and JavaScript. No build step, no dependencies — upload the folder as it is.

## Publish on GitHub Pages

1. Create a new repository on GitHub (public, or private on a paid plan).
2. Upload **the contents of this folder** to the repository root, so `index.html` sits at the top level
   (Add file → Upload files → drag everything in, including the `css`, `js`, `assets` and `insights` folders and the `.nojekyll` file).
3. In the repository go to **Settings → Pages**, set **Source** to *Deploy from a branch*, pick `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://<your-user>.github.io/<repository>/`.

All links are relative, so the site works from that sub-path and from a custom domain.

## Preview locally

Double-clicking `index.html` works. For the most faithful preview, serve the folder:

```
python -m http.server 8000
```

then open http://localhost:8000.

## Structure

```
index.html                 Home
case-studies.html          Case studies (card layout, "Read more" expanders, sticky index)
insights.html              Insights listing
insights/<slug>.html       Six article pages (odd = dark hero, even = light hero)
css/styles.css             All styles, organised by section (see the table of contents at the top)
js/land-dots.js            Land outline data for the globe
js/globe.js                Rotating, draggable dot globe (any <canvas data-globe>)
js/home.js                 Homepage tabs, case study carousel, contact form placeholder
js/case-studies.js         "Read more" expanders and the scroll-following index
js/article.js              "Copy link" share button
assets/images/…            Photos, grouped by section
assets/logos/…             TAG, C4 EcoSolutions and accreditation logos
```

## Things to finish before going live

- **Contact form** — it is not connected to anything yet; submitting shows a placeholder message.
  To make it send, add an `action` to the `<form>` in `index.html` pointing at a form service
  (for example Formspree or Netlify Forms) and `method="POST"`. Once `action` is set, the placeholder message is skipped.
- **Case studies** — the three engagements are illustrative, and the "Read more" content is lorem ipsum placeholder text
  (results are marked `[RESULT]`).
- **Article share links** point to the articles' current addresses on tagintdev.com. Update them in each
  `insights/*.html` file if the articles move.
- **Legal links** in the footer point to the existing pages on tagintdev.com.
- **Images** — check usage rights for all photos, including the visible "robin" label on the sensor
  (`assets/images/what-we-do/interoperability.jpg`) and the identifiable officials and insignia in the meeting and border photos.
