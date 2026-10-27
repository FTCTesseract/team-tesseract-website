# Team Tesseract | FTC 21689 Website

Static website for FTC Team 21689 (Team Tesseract), Nashua, New Hampshire.

## Structure

```
team-tesseract-website-main/
├── index.html          # Main page (single-page, scroll-sections layout)
├── README.md           # This file
├── assets/
│   ├── css/styles.css  # All styles
│   ├── js/main.js      # Interactivity (nav, scroll, gallery, counters, tilt)
│   └── img/            # Images (logos, robots, team, outreach, mentors)
└── IMG_1606.jpeg       # Main robot photo (referenced directly in index.html)
```

## How to edit

- **Text / content:** Edit `index.html`. Sections are ordered: Home → About → Team → Seasons → Robot → Into the Deep → Outreach → Press → Sponsors → Donate → Footer.
- **Styling:** Edit `assets/css/styles.css`.
- **Interactivity:** Edit `assets/js/main.js` (navigation, scroll progress, reveal animations, counters, gallery, magnetic buttons, tilt cards).
- **Images:** Replace files in `assets/img/` or update `IMG_1606.jpeg`. Keep filenames matching the references in `index.html`, or update the `src` attributes accordingly.

## Section numbering

Eyebrow headings are numbered in order:
1. About
2. Team
3. Seasons
4. Robot (Anakata)
5. Into the Deep
6. Outreach
7. Press
8. Sponsors

If you insert or remove a section, update the eyebrow numbers and the `sectionIds` array in `assets/js/main.js` so scroll-spy highlighting stays correct.

## Deploy

This is a static HTML/CSS/JS site. No build step or server is required. Host `index.html` and the `assets/` folder on any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc.).

## Cache busting

Assets are referenced with manual query params (e.g. `styles.css?v=11`). Bump the version number when you deploy changes so visitors get the latest files.
