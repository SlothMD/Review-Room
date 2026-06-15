# Review Author

Review Author is a Chrome Manifest V3 extension that drafts Amazon product reviews using a local Ollama model. It reads basic product context from the active Amazon product page, combines that with reviewer notes from the popup, and generates separate plain-text fields for Amazon's review form.

## Current Status

The extension is ready for local testing.

- Chrome extension manifest loads with valid icons.
- Popup lists local Ollama models from `http://localhost:11434/api/tags`.
- Review generation runs from the popup against `http://localhost:11434/api/generate`.
- Amazon page scraping is limited to product title and description/bullets for factual context.
- Reviewer notes are weighted above listing text to avoid marketing-copy output.
- Generated output is opened in a durable review workspace tab and split into Suggested Stars, Generated Review, and Title.
- The review workspace provides explicit copy buttons for full review, title, and body.
- Generated review/title text is scrubbed into plain text by removing common LLM preambles, Markdown headings, bold/italic markup, bullets, numbered lists, and dividers.
- `restart-ollama-for-extension.cmd` configures Ollama to accept browser extension origins.

## Files

- `manifest.json`: Chrome MV3 configuration, permissions, icons, and host access.
- `popup.html`: Extension popup markup.
- `popup.js`: Ollama model loading, product-page scraping, guidance migration, pending session creation, and review workspace tab launch.
- `review.html`: Durable full-tab review workspace opened after generation.
- `review.js`: Review workspace behavior, copy controls, feedback regeneration, missing-topic input, follow-up questions, and session persistence.
- `review-core.js`: Shared Ollama generation, prompt building, JSON parsing, text cleanup, and clipboard helpers.
- `styles.css`: Popup layout and styling.
- `content.js`: Minimal product-info helper retained for compatibility.
- `restart-ollama-for-extension.cmd`: Optional helper to set `OLLAMA_ORIGINS` and restart Ollama on Windows.
- `images/`: Extension icons.
- `refs/`: Agent-Academy project-memory harness for durable planning, architecture, testing, operations, and handoff notes.

## Agent-Academy Harness

This repo includes the `refs/` harness initialized from `SlothMD/Agent-Academy`. Agents and collaborators should start with `refs/project.yaml`, `refs/agents.yaml`, `refs/planning/roadmap.yaml`, `refs/planning/todos.yaml`, and `refs/testing/validationCommands.yaml` before making implementation changes.

## Requirements

- Google Chrome with extension developer mode.
- Ollama installed locally.
- At least one Ollama model pulled locally.

Example:

```cmd
ollama pull qwen2.5:7b-instruct
```

## Local Setup

1. Start Ollama.

```cmd
ollama serve
```

2. Open Chrome and go to:

```text
chrome://extensions
```

3. Enable Developer Mode.

4. Click `Load unpacked`.

5. Select this project directory:

```text
D:\Apps\Review-Author
```

6. Open an Amazon product page.

7. Open the Review Author extension popup, select an Ollama model, add reviewer notes, and click `Create Review`.

The popup opens a full-tab review workspace, and the workspace generates the review in that durable tab. The workspace has three editable output fields:

- `Suggested Stars`: A whole-number rating from 1 to 5 inferred from the reviewer notes.
- `Generated Review`: The plain-text review body.
- `Title`: A short plain-text review title.

The review workspace includes copy buttons for the full review, title, and body. The full review copy format is:

```text
Title

Generated Review
```

## Ollama Origin Handling

Ollama must allow requests from browser extension origins. Run:

```cmd
restart-ollama-for-extension.cmd
```

That script sets:

```cmd
OLLAMA_ORIGINS=chrome-extension://*,moz-extension://*,safari-web-extension://*
```

Then it attempts to restart Ollama and verify that extension-style origins are accepted. If Windows denies process termination, quit Ollama from the taskbar tray or run the script as administrator.

## Guidance Behavior

The default guidance is designed to produce structured, paste-ready review fields:

- No preamble such as "Okay, here's a review."
- No Markdown.
- No headers, bullets, rating, or sign-off.
- Reviewer notes are treated as the source of truth.
- Narrative asides, dry jokes, sarcastic observations, wry phrasing, and specific angles in reviewer notes are preserved and worked into the review.
- Product-page text is used only as factual context.
- Generated reviews are nudged toward 2-3 real paragraphs: first impression or experience, practical details or tradeoffs, and an optional final judgment.
- Sparse notes should be expanded through implications and careful phrasing, not invented facts or personal experience.
- The voice should sound like a real person reviewing the item, not a manufacturer selling it.
- Suggested stars, generated review, and title are requested as JSON internally, then displayed as separate fields.

Existing saved guidance is automatically upgraded when it lacks the newer `Priority`, `Avoid`, `Depth`, or `ReviewerVoice` fields.

## Validation

Run these checks from the project root:

```cmd
node --check popup.js
node --check review-core.js
node --check review.js
node --check content.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest json ok')"
```

## Known Limitations

- The popup depends on a local Ollama server being reachable at `localhost:11434`.
- Amazon markup changes may require updating selectors in `scrapeProductInfo`.
- The plain-text scrubber removes common Markdown patterns but is intentionally conservative to avoid damaging normal review text.
