# Data Flow

The user opens the popup, selects an Ollama model, and enters reviewer notes. The popup stores model selection and guidance in `chrome.storage.sync`.

When the user creates a review, `popup.js` verifies the active tab is an Amazon page and injects `scrapeProductInfo` with `chrome.scripting.executeScript`. The popup stores a pending review session in `chrome.storage.local` with reviewer notes, guidance, scraped product context, model selection, and source tab metadata, then opens `review.html`.

Full-tab flow: `review.html` loads the pending session id from the query string and performs initial generation from the durable tab. Ollama streams response chunks back to the workspace. The workspace accumulates text, extracts the JSON object, cleans the title and review body, displays suggested stars, title, review body, product context, operation buttons, and iteration controls, then saves the ready session back to `chrome.storage.local`. Feedback, missing keyword/topic entries, and follow-up answers are included in subsequent regeneration prompts along with the original reviewer notes and previous draft.

Follow-up question flow: ask the model to identify what a good review of this specific product would answer that the original pass did not cover, using product context, reviewer notes, and the current draft. The resulting questions should be concrete, reviewer-answerable, and useful for improving the next generated review.

Planned history flow: review sessions and iterations should eventually be stored locally with enough metadata to recover the work without sending reviewer notes or generated text to hosted services unless a future provider decision explicitly allows it. Storage choice is intentionally open and lower priority pending best-practice recommendation.
