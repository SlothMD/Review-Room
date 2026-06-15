# Coding Standards

- Keep the extension loadable without a build step unless a documented decision changes that.
- Prefer plain JavaScript and browser APIs already used in the repo.
- Keep permissions in `manifest.json` narrow and justified by behavior.
- Do not persist reviewer notes, generated reviews, or page context without a product decision.
- Validate changed JavaScript with `node --check` and validate `manifest.json` before finishing.
