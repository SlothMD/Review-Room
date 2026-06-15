# Architecture Overview

Review Author is a small Chrome Manifest V3 extension. The current implementation has three runtime surfaces:

- `popup.html`, `styles.css`, and `popup.js` implement the popup UI, model selection, guidance editing, generation flow, output rendering, and clipboard copy.
- `chrome.scripting.executeScript` injects the `scrapeProductInfo` function from `popup.js` into the active Amazon tab to read product title and description context.
- `content.js` contains a minimal product-info helper retained for compatibility.

The full-tab review workspace is implemented as `review.html`. The popup is the capture/start surface, while the full tab owns durable initial generation, output display, operation buttons, feedback-based regeneration, missing keyword/topic input, follow-up questions, and future review history entry points.

The extension calls a local Ollama server at `http://localhost:11434` for MVP model listing and text generation. It expects Ollama CORS/origin handling to allow Chrome extension origins; `restart-ollama-for-extension.cmd` configures this on Windows. Planning should allow a future model-provider boundary for hosted or pluggable providers, but that is not an MVP implementation requirement.

Persistence is currently light. `chrome.storage.sync` stores the selected Ollama model and editable generation guidance. Reviewer comments, generated reviews, suggested stars, and review titles are not persisted by the current implementation. Future work should add local review history so generated reviews and iterations can be recovered, reviewed, and deleted.

The main product boundary is between user-authored reviewer notes and product-page context. Reviewer notes are the source of truth for sentiment, rating, and personal experience. Amazon page text is only factual context used to avoid incorrect product details.
