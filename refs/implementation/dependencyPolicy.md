# Dependency Policy

The current project has no runtime npm dependencies and no build step. Add dependencies only when they materially reduce risk or complexity.

Before adding a dependency, record the rationale in `refs/planning/decisions.yaml` if it changes runtime behavior, packaging, privacy, or browser support. Keep local Ollama as the default provider unless a provider-scope decision changes it.
