# Repo Conventions

The repository root is the extension root loaded by Chrome as an unpacked extension. Runtime files live at the top level: `manifest.json`, `popup.html`, `popup.js`, `content.js`, `styles.css`, image assets, and the Ollama helper script.

Use `refs/` for durable project memory, not runtime code. Update refs when architecture, planning, testing, or handoff facts change.

There is currently no package manager, bundler, generated source directory, or test runner.
