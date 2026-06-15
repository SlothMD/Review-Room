# Refs Initialization Guide

This folder is a project-memory template for coding agents and human collaborators.

To initialize a project:

1. Copy this `refs` folder into the project root.
2. Replace placeholder values with project-specific facts.
3. Keep durable project knowledge here instead of only in chat.
4. Do not store secrets, API keys, tokens, passwords, or machine-only credentials in refs.
5. Store machine-local paths and tool locations only when the target file explicitly calls for machine-local configuration.

Recommended first files to fill:

- `project.yaml`: project identity, purpose, stack summary, source-of-truth links.
- `agents.yaml`: instructions agents must follow before editing the project.
- `planning/roadmap.yaml`: current direction and sequence.
- `planning/todos.yaml`: durable task list.
- `architecture/overview.md`: how the system is shaped.
- `implementation/fileMap.yaml`: where important code lives.
- `handoffs/currentHandoff.md`: current state and next-agent context.
- `testing/validationCommands.yaml`: commands agents should run before finishing work.

Use `refs/fileGuide.yaml` for file-by-file guidance.
