# Plan: Add Local AI Usage and Conversation History to Profile Page

This plan implements the addition of local AI usage statistics (total tokens) and a conversation history section to the Profile page in the VS Code extension.

## Context
- The Profile page is currently located in `packages/kilo-vscode/webview-ui/src/components/profile/ProfileView.tsx`.
- It currently shows provider usage via `ProviderUsageCards`.
- The user wants to see:
    1. Total tokens used across all local chats.
    2. A list of recent local conversations (similar to the "Recent" section in the sidebar).
- These features should only be visible on the Profile page.

## Implementation Steps

### 1. Backend (CLI)
- **Add `totalTokens` handler**:
    - In `packages/opencode/src/kilocode/server/httpapi/handlers/agent-usage.ts`, add a new handler `totalTokens` to `agentUsageHandlers`.
    - This handler will use the existing `runs` CTE to calculate the sum of `input + output + reasoning + read + write` for all runs in the current project.
    - It should support optional `from` and `to` date filters.
- **Expose the endpoint**:
    - In `packages/opencode/src/kilocode/server/httpapi/public.ts`, add the `totalTokens` route to the `agent-usage` group.

### 2. Extension (Host)
- **Define new message types**:
    - In `packages/kilo-vscode/webview-ui/src/types/messages/provider-usage.ts`, add `LocalUsageLoadedMessage` and `RequestLocalUsageMessage`.
- **Update Host Handler**:
    - In `packages/kilo-vscode/src/KiloProvider.ts`, add a handler for `localUsageLoaded` to update the `localUsage` state in `ServerContext`.
- **Update Server Context**:
    - In `packages/kilo-vscode/webview-ui/src/context/server.tsx`, add `localUsage: Accessor<number | undefined>` to `ServerContextValue`.
    - Add `requestLocalUsage: () => void` to `ServerContextValue`.
    - Implement `requestLocalUsage` in `ServerProvider` by sending a `requestLocalUsage` message to the extension host.

### 3. Webview (UI)
- **Update Profile View**:
    - In `packages/kilo-vscode/webview-ui/src/components/profile/ProfileView.tsx`:
        - Add a new section for "Local AI Usage" displaying the total tokens.
        - Add a "Show History" button that toggles a `showHistory` signal.
        - When `showHistory` is true, render the `SessionList` component from `packages/kilo-vscode/webview-ui/src/components/history/SessionList.tsx`.
        - Use `session.loadSessions()` and `session.sessions()` to populate the list.
        - Style the new sections to match the existing Profile page design.

## Validation Plan
- Verify that the total tokens are correctly displayed on the Profile page.
- Verify that clicking "Show History" correctly displays the list of recent sessions.
- Verify that the history list is only visible on the Profile page and not in the sidebar.
- Ensure that the new features do not break existing functionality.
