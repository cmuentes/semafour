# Server Option to Pop-up Menu Plan

This plan converts the mobile server toggle button in the `PromptInput` component into a `DropdownMenu` that provides options to enable/disable the server, copy its URL, and open it in a browser.

## Context

The current implementation in `packages/kilo-vscode/webview-ui/src/components/chat/PromptInput.tsx` uses an `IconButton` that toggles the mobile server state via `mobile.toggle()`.

## Goals

- Replace the `server` `IconButton` with a `DropdownMenu`.
- Add "Enable/Disable server" option.
- Add "Copy URL" option (if URLs are available).
- Add "Open URL in Browser" option (if URLs are available).

## Implementation Steps

### 1. Update Imports
- Add `import { DropdownMenu } from "@kilocode/kilo-ui/dropdown-menu"` to `packages/kilo-vscode/webview-ui/src/components/chat/PromptInput.tsx`.

### 2. Modify `PromptInput` Component
- Locate the `server` `IconButton` (around line 2404).
- Replace it with a `DropdownMenu` structure:
    - `DropdownMenu.Trigger`: An `IconButton` with `icon="server"`.
    - `DropdownMenu.Portal`:
        - `DropdownMenu.Content`:
            - `DropdownMenu.Item` for toggling the server.
            - `DropdownMenu.Separator` (if URLs are available).
            - `DropdownMenu.Item` for copying the first URL from `mobile.urls()`.
            - `DropdownMenu.Item` for opening the first URL from `mobile.urls()` in a new tab.
- Use `showToast` to notify the user when a URL is copied.
- Use `language.t` for menu item labels, falling back to English if keys are missing.

## Risks & Edge Cases

- **No URLs available:** The "Copy URL" and "Open URL in Browser" items should only be visible if `mobile.urls().length > 0`.
- **Clipboard access:** Ensure `navigator.clipboard.writeText` is used safely.
- **UI Consistency:** Ensure the menu styling and placement match the existing `DropdownMenu` usage in the codebase.

## Validation Plan

- Verify that clicking the server icon opens the menu.
- Verify that "Enable/Disable server" correctly toggles the server state.
- Verify that "Copy URL" copies the correct URL and shows a success toast.
- Verify that "Open URL in Browser" opens the correct URL in a new tab.
- Verify that the menu items are hidden when no URLs are present.
- Run `bun run compile` in `packages/kilo-vscode/` to ensure no type errors.
