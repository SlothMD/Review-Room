# Test Strategy

Current validation is lightweight because the extension has no package or automated test harness. Required command checks are JavaScript syntax validation for `popup.js` and `content.js`, plus JSON parsing for `manifest.json`.

Manual smoke testing is required for browser behavior: load the unpacked extension, connect to Ollama, scrape an Amazon page, generate output, and confirm clipboard copy.

If generation logic grows, add unit coverage for prompt construction, JSON extraction, text cleanup, star cleaning, and error formatting.
