# Copilot instructions for movilidad

- This is a static website project. The app is built from plain HTML files in the repo root plus a shared stylesheet at `css/style.css`.
- Key pages: `index.html`, `nosotras.html`, `consejos.html`, `rutas.html`. Each page links to `css/style.css` and uses relative paths like `./nosotras.html` or `./css/style.css`.
- There is no JavaScript logic in the current site. The `js/` folder exists but is empty, so do not assume runtime JS behavior or a build step.
- `docs/index.html` is a separate documentation/prototype page. It uses an external Typekit stylesheet and inline page-specific CSS in addition to `../css/style.css`.
- `img/` contains static image assets. When adding visuals, reference them with relative paths from HTML pages.
- The stylesheet defines custom font faces and CSS variables in `:root`. Preserve the existing theme colors and typography approach when updating styles.
- Common patterns to follow:
  - Use semantic HTML sections (`<header>`, `<main>`, `<section>`, `<article>`) like the existing pages.
  - Keep navigation consistent across pages and update all nav menus if a new page is added.
  - Maintain Spanish labels and page content tone used across the site.
- There is no package manager or test/CI config in the repo. Do not add Node/npm tooling unless explicitly requested.
- Useful quick checks:
  - Open `index.html` in a browser to preview changes.
  - Verify relative link correctness after moving or renaming files.
- Known source issues to avoid repeating:
  - `css/style.css` currently has a broken rule: `a { color: var(--accent-color; }` is missing a closing parenthesis.
  - `consejos.html` contains malformed closing `<a>` markup in the nav.

If anything in this guidance is unclear, ask me which page or style rule should be prioritized next.