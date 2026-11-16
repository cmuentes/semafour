# Move Mobile Bridge Server Toggle to Prompt Input

This plan moves the `MobileBridgeServer` toggle icon from the chat header to the prompt input area to ensure it is always visible.

## Implementation Details

### 1. Update `packages/kilo-vscode/webview-ui/src/components/chat/PromptInput.tsx`

- **Imports**: Add `import { useMobileServer } from "../../context/mobile-server"`.
- **State**: Add `const mobile = useMobileServer()`.
- **UI**: In the `prompt-input-hint` div, insert a new `prompt-action` div before the indexing action.
  - The new action will contain:
    - A `Tooltip` with `placement="top"` and `openDelay={0}`.
    - The tooltip content will show the server URLs when `mobile.running()` is true:
      ```tsx
      <div style={{ "text-align": "left", "white-space": "nowrap" }}>
        <div>{language.t("mobileServer.url")}</div>
        <For each={mobile.urls()}>{(u) => <div>{u}</div>}</For>
      </div>
      ```
    - An `IconButton` with:
      - `icon="server"`
      - `variant="ghost"`
      - `size="small"`
      - `onClick={() => mobile.toggle()}`
      - `aria-label={mobile.running() ? language.t("mobileServer.stop") : language.t("mobileServer.start")}`
      - `data-active={mobile.running() ? "" : undefined}`

### 2. Update `packages/kilo-vscode/webview-ui/src/components/chat/TaskHeader.tsx`

- **Cleanup**:
  - Remove `import { useMobileServer } from "../../context/mobile-server"`.
  - Remove the `mobileTooltip` memo.
  - Remove the `IconButton` and `Tooltip` from the `task-header-stats` div.

## Validation Plan

1. **Visibility**: Open a new, empty Semafour session. Verify the server icon is visible in the prompt input area (to the left of the database icon).
2. **Functionality**: Click the icon. Verify the server starts (the icon should show an active state).
3. **Tooltip**: Hover over the active icon. Verify the tooltip displays the correct LAN URLs.
4. **Toggle**: Click the icon again. Verify the server stops and the icon returns to its inactive state.
5. **Regression**: Ensure the chat header still displays cost and token usage correctly.
