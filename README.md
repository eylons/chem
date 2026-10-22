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
   git add index.html style.css script.js manifest.webmanifest icon.svg sw.js README.md
   git commit -m "Build CHEM 233 Mechanism Quest"
   git remote add origin https://github.com/YOUR-PERSONAL-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```

   Replace both placeholders with the repository under your personal account. If this folder is already initialized as a Git repository, skip `git init` and add the remote only if it is not already configured.
3. On that repository's GitHub page, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/(root)`, then save.
4. Open the Pages URL shown in Settings → Pages (usually `https://YOUR-PERSONAL-USERNAME.github.io/YOUR-REPOSITORY/`). Bookmark it. The first visit needs a connection so the browser can cache the site; later visits can work offline in browsers that support service workers.

You sign in to GitHub to manage the repository and deployment. Visitors to the website do not sign in. Progress belongs to the browser and site origin where it was created: a different browser, device, or domain has separate local storage. Use **Export save** and **Import save** to transfer it. A save file is private study data; keep it out of the public repository.

## Import course content without replacing progress

Use **Import save / content pack** to add questions. A content pack is JSON and can be imported repeatedly only if its question IDs are unique. Importing questions adds them to the existing question bank and leaves XP, mastery, streaks, and review schedules untouched. A save file instead restores the whole progress state and asks for confirmation before replacing the current state.

Version 1 content-pack structure:

```json
{
  "format": "mechanism-quest-content-pack",
  "version": 1,
  "pack": {
    "id": "unique-pack-id",
    "title": "Pack title",
    "scope": "confirmed-course-material"
  },
  "questions": [
    {
      "id": "unique-question-id",
      "course": "mt1",
      "courseSpecific": true,
      "topic": "Acid/base equilibrium",
      "type": "choice",
      "question": "Which side is favored?",
      "context": "Optional structure or notation shown with the prompt",
      "choices": ["Left", "Right"],
      "answer": "Right",
      "explanation": "Why the answer follows from the course rule.",
      "hint": "A cue revealed after the student commits.",
      "difficulty": 2,
      "skills": ["acid-base equilibrium", "pKa"],
      "prerequisiteSkills": ["pKa recall"],
      "commonMistakes": ["Compare the wrong acids"],
      "tags": ["equilibrium", "midterm-1"]
    }
  ]
}
```

Supported types:

- `choice`: `choices` (strings) and `answer` (one of those strings).
- `text`: `acceptedAnswers` (non-empty array of strings); free-response matching ignores capitalization and basic punctuation.
- `draw`: `rubric` with the expected features or point criteria. Students self-assess against it.
- `rank`: `items` and `answer`, both arrays containing the same strings; `answer` is the required order.
- `select-atom`: a `structure` object with `viewBox`, `atoms` (`id`, `label`, numeric `x`/`y`), and `bonds` (`from`, `to`, `order` of 1 or 2); `answer` is the correct atom ID. The app renders and makes the atoms keyboard/click selectable as SVG.

Every question needs a unique `id`, `topic`, `question`, `explanation`, and a non-empty `skills` array. `context`, `hint`, `difficulty`, `prerequisiteSkills`, `commonMistakes`, and `tags` are optional descriptive fields. `course` can be `mt1` or `mt2`; it defaults to `mt1`.

Midterm 2 questions do **not** count as confirmed course coverage unless the pack uses `"scope": "confirmed-course-material"` and each relevant question sets `"courseSpecific": true`. Do not use that flag for generic textbook material: this keeps unsupported conventions out of the Midterm 2 readiness score. Generic imported questions may still be practiced. Every imported question should be checked against the actual slides or problem-set key before it is treated as course-specific.

## Data and privacy

- Study progress, imported questions, and theme preference are stored only in this browser's local storage. Clearing browser site data removes them.
- **Export save** downloads a JSON backup containing progress and imported question packs. Keep the backup somewhere private.
- **Import save / content pack** accepts either an exported save or a content pack. Save imports replace current progress only after a confirmation; content-pack imports append unique questions.
- **Reset progress** asks for confirmation, then clears the saved game state, including imported content.
- No credentials or personal data should be committed to this repository. The static site has no server to receive browser progress.

## Source and course conventions

The built-in Midterm 1 bank follows `CHEM233_compacted_course_context.md`, including the course's pKa ladder, its acetal/ketal terminology, no-carbocation-rearrangement rule, heat-as-E1 cue, neutral water/alcohol nucleophile convention, and stereochemical product-count checks. Midterm 2 remains locked until course material is added; its scheduled topic headings are not treated as sufficient evidence for professor-specific chemistry.

The built-in bank has over 60% active-recall items (short responses, ranking, drawing rubrics, and clickable structure interpretation). Safer pKa comparisons also vary across the course's approximate memorization ladder on page loads; choices are shuffled where multiple choice is used.
