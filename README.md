# CHEM 233: Mechanism Quest

A static, browser-based chemistry study game. There is no server-side profile, sign-in, analytics, paid API, or runtime dependency. Progress is stored in the browser's `localStorage`; exported JSON saves can be moved between browsers.

## Run locally

For the most representative local test, serve this folder over HTTP rather than opening `index.html` as a `file://` URL. For example, with Python installed:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. No packages need to be installed. The service worker is enabled on localhost and on HTTPS hosting. After the hosted site has loaded once, its app files are cached for offline visits. Browser-local progress remains available offline.

## Publish free from your personal GitHub account

The site files can live in a repository under your **personal GitHub account**. Nothing in this project points to or requires an Infostrux organization.

1. Create a new repository while signed in to your personal GitHub account. For GitHub Pages at no charge on the standard plan, make the repository public. Repository contents will then be public; do not put private course files, save backups, or credentials in it.
2. In this project folder, initialize Git and commit the site files:

   ```sh
   git init -b main
   git add index.html style.css js/*.js manifest.webmanifest icon.svg sw.js README.md
   git commit -m "Build CHEM 233 Mechanism Quest"
   git remote add origin https://github.com/YOUR-PERSONAL-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

   Replace both placeholders with the repository under your personal account. If this folder is already initialized as a Git repository, skip `git init` and add the remote only if it is not already configured.
3. On that repository's GitHub page, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/(root)`, then save.
4. Open the Pages URL shown in Settings → Pages (usually `https://YOUR-PERSONAL-USERNAME.github.io/YOUR-REPOSITORY/`). Bookmark it. The first visit needs a connection so the browser can cache the site; later visits can work offline in browsers that support service workers.

You sign in to GitHub to manage the repository and deployment. Visitors to the website do not sign in. Progress belongs to the browser and site origin where it was created: a different browser, device, or domain has separate local storage. Use **Export save** and **Import save** to transfer it. A save file is private study data; keep it out of the public repository.

## Architecture

Plain static files, no build step, no dependencies:

| File | Role |
|---|---|
| `index.html` | Shell plus a small inline startup guard. If any script fails, it shows "Mechanism Quest could not start." with Retry / Start without loading save / Import backup / Clear cached app files. |
| `js/util.js` | DOM builder, dates, answer normalization. |
| `js/content.js` | Question validation, confirmed-vs-preview classification, campaign regions, enemy catalogue. |
| `js/questions.js` | Built-in Midterm 1 bank. **Generated** by `python3 tools/build_questions.py`; do not hand-edit. |
| `js/storage.js` | Load, migrate (v1 to v2), save, export, import. Never throws; malformed data degrades to defaults. |
| `js/engine.js` | Mastery, spaced repetition, enemies, XP, run building, readiness, exam scoring. No DOM. |
| `js/app.js` | Views and flows. Builds DOM nodes directly (no HTML strings). |
| `sw.js` | Network-first service worker, cache `mechanism-quest-clean-v1`; deletes older caches. |

Saves live under `chem233-mechanism-quest-save-v2`. On first load, the v1 key (`chem233-mechanism-quest-save-v1`) is migrated and **left untouched**, so the previous build can still be restored from git history.

## Checks before every deploy

```sh
sh tools/check.sh   # parses every JS file + inline scripts with JavaScriptCore (Safari's engine)
sh tests/run.sh     # headless logic tests; PACK_DIR must hold the two content-pack JSON files
```

`tests/browser-driver.js` is a local-only helper that plays a run by clicking the real UI buttons.

## Content packs (version 1)

Content packs are not stored in this public repository. Import them in the app with **Data → Import Content Pack**. Importing appends questions and never changes existing progress. A question whose `id` already exists is skipped and reported, never overwritten.

```json
{
  "format": "mechanism-quest-content-pack",
  "version": 1,
  "pack": { "id": "unique-pack-id", "title": "Pack title", "scope": "confirmed-course-material" },
  "questions": [
    {
      "id": "unique-question-id", "course": "mt2", "courseSpecific": true,
      "topic": "SN2 stereochemistry", "type": "choice",
      "question": "...", "choices": ["Retention", "Inversion"], "answer": "Inversion",
      "explanation": "...", "skills": ["sn2", "stereochemistry"], "difficulty": 2,
      "hint": "legacy single hint",
      "hints": ["small nudge", "stronger direction", "scaffold without the answer"],
      "keyRule": "optional one-line rule shown after answering",
      "module": "optional unit name; unknown units become new map regions",
      "tags": [], "commonMistakes": [], "sourceNote": ""
    }
  ]
}
```

Types: `choice` (`choices`, `answer`), `text` (`acceptedAnswers`), `draw` (`rubric` string, or `{answer, full[], minor[], major[]}`), `rank` (`items`, `answer` order), `select-atom` (`structure` with `atoms`/`bonds`, `answer` atom id). Any type may include a `structure` diagram.

**Confirmed vs preview.** Official Midterm 2 readiness counts only `course: "mt2"` with `courseSpecific: true` from a pack whose scope is `confirmed-course-material`. Final readiness counts all confirmed material (MT1 + confirmed MT2 + future confirmed units). `courseSpecific: false` MT2 questions are preview material: they appear in **Ahead of Class** and never affect readiness, official mastery or the enemy database.

## Data and privacy

- Progress, imported questions and theme stay in this browser's storage. **Export Save** regularly; a save file is private study data, so keep it out of this repo.
- **Reset Progress** requires typing RESET.
- No account, analytics, server or API key.
