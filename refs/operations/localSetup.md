# Local Setup

1. Install Chrome.
2. Install Ollama and pull at least one local model, for example `ollama pull qwen2.5:7b-instruct`.
3. Start Ollama with `ollama serve`.
4. If browser extension origins are rejected, run `restart-ollama-for-extension.cmd`.
5. Open `chrome://extensions`, enable Developer Mode, choose `Load unpacked`, and select this repository root.
6. Open an Amazon product page, open the extension popup, select a model, enter reviewer notes, and create a review.
