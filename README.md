# Pilotos Grounds Website

Marketing site for Pilotos Grounds (mobile espresso cart) and its sister venue Afterhours. Plain static HTML/CSS/JS — no framework, no build step, no templating. Each page (`index.html`, `packages.html`, `portfolio.html`, `afterhours.html`, `menu.html`, `contact.html`, `terms.html`) is a standalone file that repeats its own `<header>`/`<footer>` markup.

## Working directory — read this first

**The real, git-tracked working copy is `C:\Pilotos\_repo_clone\pilotos-grounds-website`.** This is a clone of the live GitHub repo (`https://github.com/BunquinTheodore/pilotos-grounds-website`), which the deployed site (pilotosph.vercel.app, via Vercel) builds from.

`C:\Pilotos\website` is a **stale, disconnected copy** with no `.git` history — it was the original local folder before this clone existed, and it drifted out of sync with the real repo (it was missing an entire EmailJS integration that the repo had). **Do not edit `C:\Pilotos\website` — always work in `_repo_clone`.** Ideally this stale folder gets deleted/retired once confirmed safe to do so.

## Stack notes

- **Fonts/scroll/animation**: GSAP + ScrollTrigger, Lenis smooth scroll, all loaded via CDN `<script>` tags per page.
- **Form submission**: `contact.html`'s quote form POSTs to Formspree (`https://formspree.io/f/mljeppan`), which notifies `hello@pilotos.ph`.
- **Auto-reply email**: handled separately by **EmailJS** (`assets/js/main.js`, `initForm()` — `EMAILJS_SERVICE_ID`/`TEMPLATE_ID`/`PUBLIC_KEY` constants near the top of the file). This is the "auto-reply to the person who submitted" — do not remove this when touching the form, it's easy to accidentally drop since it looks decorative.
- **Design system**: brand colors/fonts defined as CSS custom properties in `assets/css/style.css` `:root`. Light theme is default; `.theme-afterhours` (applied to a `<body>` or a single `<section>`) flips to the dark Afterhours look. `.eyebrow` labels render uppercase; only description/body copy (`.desc`, `.lede`) is styled lowercase.
- **Photo galleries**: `[data-gallery]` grids of `.gallery-item` divs with `data-full`/`data-cat` feed a shared lightbox (`#lightbox` at the bottom of each page, JS in `initGallery()`). Every full-size photo has a matching `thumbs/` version generated via a PowerShell/.NET resize script (no ImageMagick on this machine — see any recent session transcript for the `convert_one.ps1` pattern).

## Git / push workflow gotcha

Git is installed but this dev environment has no real interactive terminal, so `git push` can't use its normal credential prompt/browser flow. The working pattern: fetch the already-cached GitHub credential directly from Git Credential Manager and pass it as an inline `Authorization: Basic` header for that one push command (see recent session transcripts for the exact PowerShell snippet). Never write the raw token to a file.

## Current status (as of last session)

Two rounds of client revisions have shipped (see git log for commit messages — they're detailed). Known **outstanding/open items**:

1. **Item N** (from the round-2 revision PDF) — adding a background photo to a "private events" divider on `afterhours.html` — was left unresolved because its exact target element was ambiguous even after code review. Needs a fresh look at the PDF/client screenshot before attempting.
2. **A second duplicate photo** was found in the Afterhours "What's served" gallery: `assets/img/afterhours/food/DSC_0089.jpg` (an old pre-existing photo) and `assets/img/afterhours/food/afterhours-served-flambe.jpg` (added this round, from `Menu 6.jpg`) are the same flambé-pasta shot. Only one has been fixed so far (a different bartender-photo duplicate, `DSC_0206.jpg`, was swapped for `Menu 2.png`). This one is still open — needs either a replacement photo or removal.
3. **`C:\Pilotos\website`** (the stale folder) has not been deleted. Worth confirming with the client/dev before removing it entirely.

## Source photo folders

- `C:\Pilotos\FOR WEBSITE\` — the original client-provided photo batch (Afterhours/Events/Menu/Packages subfolders), reused across both revision rounds.
- Individual newer downloads sometimes land directly in `C:\Users\THEODORE VON JOSHUA\Downloads\` or as Google Drive folder ZIPs — check recent session transcripts for exactly which files came from where if provenance matters.

## Local preview

No build step needed — just serve the folder statically, e.g.:
```
python -m http.server 8792
```
then open `http://localhost:8792/index.html`. (Browser automation tools in this environment sometimes fail against `localhost` for unrelated sandbox reasons — a plain `python -m http.server` + manual browser check, or Chrome DevTools MCP tools, both work reliably; the general-purpose Claude-in-Chrome extension tooling has been flaky here.)
