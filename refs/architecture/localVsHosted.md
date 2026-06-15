# Local vs Hosted

Review Author is currently local-first. The browser extension runs in Chrome, generation requests go to local Ollama, and no hosted AI provider is configured for MVP.

Planning should allow future hosted or pluggable providers behind a provider boundary. Hosted provider implementation is intentionally out of MVP scope.

The extension may access Amazon product pages only through the active tab selected by the user. Reviewer notes and generated review text should remain local. Review history is planned, so future persistence must include local storage, deletion, and privacy boundaries.
