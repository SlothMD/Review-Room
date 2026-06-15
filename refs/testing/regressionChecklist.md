# Regression Checklist

- Model list loads from local Ollama when Ollama is running.
- Popup blocks generation when no model is selected.
- Popup blocks generation on non-Amazon pages.
- Product scraping returns title and usable description context on a current Amazon product page.
- Model responses are parsed into suggested stars, generated review, and title.
- Cleanup removes common preambles, markdown, headings, bullets, numbered lists, and dividers.
- Successful output copies title and review body to the clipboard.
- Planned: generated output moves to a durable Chrome tab so popup closure does not lose review state.
- Planned: feedback regeneration keeps original reviewer notes and product context while incorporating feedback, missing topics, and follow-up answers.
- Planned: review history can recover and delete generated drafts.
