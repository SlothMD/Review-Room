# Troubleshooting

## Ollama Models Do Not Load

Start Ollama and confirm `http://localhost:11434/api/tags` is reachable. If the browser extension origin is rejected, run `restart-ollama-for-extension.cmd`, then reload the extension.

## Could Not Find Product Details

Confirm the active tab is an Amazon product page. Amazon markup changes may require updating selectors in `scrapeProductInfo`.

## Generated Output Is Not Valid JSON

Try a more instruction-following local model or adjust guidance. If this becomes frequent, improve `extractJsonObject` and add automated coverage for malformed model responses.
