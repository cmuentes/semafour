# Semafour Rebranding Plan

This plan outlines the phased replacement of all user-facing "Kilo Code" and "Kilo" branding with "Semafour" across the specified files.

## Constraints & Guardrails
- **DO NOT** rename internal npm/workspace package imports (e.g., `@kilocode/kilo-ui`).
- **DO NOT** rename extension ID `"publisher": "kilocode"` or `"name": "kilo-code"` in `package.json`.
- **DO NOT** rename internal command IDs or setting keys (e.g., `"kilo-code.newTask"`).
- **DO NOT** rename dotfiles or config file names (e.g., `.kilo`, `kilo.jsonc`).
- **DO NOT** rename icon filenames (e.g., `kilo-light.svg`).

## Phase 1 — Extension Manifest
Focus on the VS Code extension identity and command categories.

### Files to modify:
- `packages/kilo-vscode/package.json`
- `packages/kilo-vscode/src/constants.ts`

### Tasks:
1. **`packages/kilo-vscode/package.json`**:
    - Replace `"displayName": "Kilo Code: ..."` with `"Semafour: ..."`
    - Replace `"author": { "name": "Kilo Code" }` with `"Semafour"`
    - Replace `"keywords": [ ..., "Kilo Code", ... ]` with `"Semafour"`
    - Replace `"viewsContainers.activitybar[0].title": "Kilo Code"` with `"Semafour"`
    - Replace `"views.kilo-code-ActivityBar[0].name": "Kilo Code"` with `"Semafour"`
    - Replace all `"category": "Kilo Code"` with `"Semafour"` in `commands`.
    - Replace all `"label": "Kilo Code"` with `"Semafour"` in `submenus`.
    - Replace `"configuration": { "title": "Kilo Code" }` with `"Semafour"`.
    - Replace `"description"` strings in `configuration.properties` that contain `"Kilo Code"` or `"Kilo"` with `"Semafour"`.
    - Replace `"enumDescriptions"` in `configuration.properties` that contain `"Kilo Gateway"` with `"Semafour Gateway"`.
2. **`packages/kilo-vscode/src/constants.ts`**:
    - Replace `EXTENSION_DISPLAY_NAME = "Kilo Code"` with `"Semafour"`.

## Phase 2 — English Localization Dictionaries & UI Copy
Focus on user-facing text in the sidebar, chat, and settings.

### Files to modify:
- `packages/kilo-i18n/src/en.ts`
- `packages/kilo-vscode/src/services/i18n/autocomplete/en.ts`
- `packages/kilo-vscode/src/services/i18n/attention/en.ts`
- `packages/kilo-vscode/src/services/i18n/mcp/en.ts`
- `packages/kilo-vscode/webview-ui/agent-manager/i18n/en.ts`
- `packages/kilo-vscode/webview-ui/src/components/chat/WelcomeEmptyState.tsx`

### Tasks:
1. **`packages/kilo-i18n/src/en.ts`**:
    - Replace `"BYOK via Kilo's Gateway"` with `"BYOK via Semafour's Gateway"`.
    - Replace `"Kilo"` with `"Semafour"` in `marketplace.install.about.*` and `snapshot.slowRepo.answer.disable.description`.
2. **`packages/kilo-vscode/src/services/i18n/autocomplete/en.ts`**:
    - Replace `"Kilo Code Autocomplete"` with `"Semafour Autocomplete"`.
    - Replace `"Kilo Code: Suggested Edits"` with `"Semafour: Suggested Edits"`.
    - Replace `"The Kilo Code Autocomplete..."` with `"The Semafour Autocomplete..."`.
    - Replace `"your Kilo account"` with `"your Semafour account"`.
    - Replace `"signed in to Kilo"` with `"signed in to Semafour"`.
3. **`packages/kilo-vscode/src/services/i18n/attention/en.ts`**:
    - Replace `"Kilo task completed."`, `"Kilo needs your input."`, `"Kilo needs permission."`, `"Kilo task stopped..."`, and `"from Kilo Code."` with `"Semafour"` equivalents.
4. **`packages/kilo-vscode/src/services/i18n/mcp/en.ts`**:
    - Replace `"Kilo could not open..."` with `"Semafour could not open..."`.
5. **`packages/kilo-vscode/webview-ui/agent-manager/i18n/en.ts`**:
    - Replace `"Kilo keeps every worktree..."` with `"Semafour keeps every worktree..."`.
    - Replace `"Keep computer awake while Kilo agents work"` with `"Keep computer awake while Semafour agents work"`.
    - Replace `"Put a fleet of Kilo agents to work."` with `"Put a fleet of Semafour agents to work."`.
    - Replace `"Compare Kilo Auto..."` with `"Compare Semafour Auto..."`.
6. **`packages/kilo-vscode/webview-ui/src/components/chat/WelcomeEmptyState.tsx`**:
    - Replace `alt="Kilo Code"` with `alt="Semafour"`.

## Phase 3 — Extension Host Notifications & System Prompts
Focus on logs, notifications, and AI system prompts.

### Files to modify:
- `packages/kilo-vscode/src/extension.ts`
- `packages/opencode/src/kilocode/review/review.txt`
- `packages/opencode/src/kilocode/session/native-plan-prompt.txt`
- `packages/opencode/src/session/prompt/gpt.txt`

### Tasks:
1. **`packages/kilo-vscode/src/extension.ts`**:
    - Replace `"Kilo Code extension is now active"` with `"Semafour extension is now active"`.
    - Replace `"applying linked Kilo selection"` with `"applying linked Semafour selection"`.
2. **`packages/opencode/src/kilocode/review/review.txt`**:
    - Replace `"You are Kilo Code, an expert code reviewer..."` with `"You are Semafour, an expert code reviewer..."`.
3. **`packages/opencode/src/kilocode/session/native-plan-prompt.txt`**:
    - Replace `"You are Kilo Code, an experienced technical leader..."` with `"You are Semafour, an experienced technical leader..."`.
4. **`packages/opencode/src/session/prompt/gpt.txt`**:
    - Replace `"You are Kilo Code, You and the user share..."` with `"You are Semafour, You and the user share..."`.
