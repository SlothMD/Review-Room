# Review Author

Review Author is a Chrome Manifest V3 extension that drafts Amazon product reviews using a local Ollama model. It reads basic product context from the active Amazon product page, combines that with reviewer notes from the popup, and generates separate plain-text fields for Amazon's review form.

## Current Status

The extension is ready for local testing.

- Chrome extension manifest loads with valid icons.
- Popup lists local Ollama models from `http://localhost:11434/api/tags`.
- Review generation runs from the popup against `http://localhost:11434/api/generate`.
- Amazon page scraping is limited to product title and description/bullets for factual context.
- Reviewer notes are weighted above listing text to avoid marketing-copy output.
- Generated output is split into Suggested Stars, Generated Review, and Title.
- Generated review/title text is scrubbed into plain text by removing common LLM preambles, Markdown headings, bold/italic markup, bullets, numbered lists, and dividers.
- A Chrome `declarativeNetRequest` rule rewrites localhost Ollama request origins to avoid Ollama rejecting `chrome-extension://` requests.

## Files

- `manifest.json`: Chrome MV3 configuration, permissions, icons, host access, and network rewrite rule registration.
- `popup.html`: Extension popup markup.
- `popup.js`: Ollama model loading, product-page scraping, prompt building, review generation, guidance migration, and plain-text cleanup.
- `styles.css`: Popup layout and styling.
- `content.js`: Minimal product-info helper retained for compatibility.
- `rules/ollama-origin.json`: Chrome network rules that rewrite Ollama request origins to localhost.
- `restart-ollama-for-extension.cmd`: Optional helper to set `OLLAMA_ORIGINS` and restart Ollama on Windows.
- `images/`: Extension icons.

## Requirements

- Google Chrome or another Chromium browser with extension developer mode.
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

The popup returns three separate boxes:

- `Suggested Stars`: A whole-number rating from 1 to 5 inferred from the reviewer notes.
- `Generated Review`: The plain-text review body.
- `Title`: A short plain-text review title.

## Ollama Origin Handling

The extension includes a Chrome network rule that rewrites extension requests to Ollama so Ollama sees a localhost origin instead of a `chrome-extension://` origin.

If a machine still returns HTTP 403 from Ollama, run:

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
- Product-page text is used only as factual context.
- The voice should sound like a real person reviewing the item, not a manufacturer selling it.
- Suggested stars, generated review, and title are requested as JSON internally, then displayed as separate fields.

Existing saved guidance is automatically upgraded when it lacks the newer `Priority` and `Avoid` fields.

## Validation

Run these checks from the project root:

```cmd
node --check popup.js
node --check content.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); JSON.parse(require('fs').readFileSync('rules/ollama-origin.json','utf8')); console.log('json ok')"
```

## Known Limitations

- The project is not currently initialized as a Git repository in this directory.
- The popup depends on a local Ollama server being reachable at `localhost:11434`.
- Amazon markup changes may require updating selectors in `scrapeProductInfo`.
- The plain-text scrubber removes common Markdown patterns but is intentionally conservative to avoid damaging normal review text.
