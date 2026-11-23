# Plan: Remove KiloNotifications Banner

This plan outlines the steps to completely remove the remote promotional notifications banner ("KiloNotifications") from the VS Code extension. This includes the webview UI component, its context, the associated message types, and the extension host's logic and network calls.

## Context

The `KiloNotifications` component displays remote notifications in the chat's empty state. It relies on a `NotificationsProvider` in the webview to manage state and a `KiloProvider` in the extension host to fetch data from the CLI backend and handle dismissal.

## Implementation Steps

### 1. Webview UI Cleanup

- [ ] **Delete** `packages/kilo-vscode/webview-ui/src/components/chat/KiloNotifications.tsx`.
- [ ] **Modify** `packages/kilo-vscode/webview-ui/src/components/chat/MessageList.tsx`:
    - Remove `import { KiloNotifications } from "./KiloNotifications"`.
    - Remove the `<KiloNotifications sessionID={props.sessionID} />` component from the `isEmpty` block (around lines 872).
- [ ] **Delete** `packages/kilo-vscode/webview-ui/src/context/notifications.tsx`.
- [ ] **Modify** `packages/kilo-vscode/webview-ui/src/context/provider-session.tsx`:
    - Remove `import { NotificationsProvider } from "./notifications"`.
    - Remove the `<NotificationsProvider>` wrapper around `{props.children}`.
- [ ] **Modify** `packages/kilo-vscode/webview-ui/src/types/messages/extension-messages.ts`:
    - Remove `interface NotificationsLoadedMessage`.
    - Remove `type KilocodeNotification`.
- [ ] **Modify** `packages/kilo-vscode/webview-ui/src/types/messages/webview-messages.ts`:
    - Remove `interface DismissNotificationMessage`.
- [ ] **Verify** `packages/kilo-vscode/webview-ui/src/stories/chat.stories.tsx` for any remaining references to `KiloNotifications` or `NotificationsProvider` and remove them.

### 2. Extension Host Cleanup

- [ ] **Delete** `packages/kilo-vscode/src/kilo-provider/notifications.ts`.
- [ ] **Modify** `packages/kilo-vscode/src/KiloProvider.ts`:
    - Remove imports from `./kilo-provider/notifications`.
    - Remove the `cachedNotificationsMessage` property.
    - Remove the `notificationsContext()` method.
    - In the message handler, remove:
        - `case "requestNotifications"` (around line 1690).
        - `case "dismissNotification"` (around line 1726).
    - Remove all calls to:
        - `this.fetchAndSendNotifications()`.
        - `dismissNotification(...)`.
        - `resetReadNotifications(...)` (found at line 1733).
- [ ] **Delete** `packages/kilo-vscode/tests/unit/kilo-provider-notifications.test.ts`.

## Validation Plan

- [ ] Run `bun run compile` from the root to ensure all type-checks pass and no broken imports remain.
- [ ] Run `bun run test` from `packages/kilo-vscode/` to ensure no regressions in other parts of the extension.
- [ ] (Optional) If possible, launch the extension in dev mode and verify the chat view works as expected without the notification banner.

## Risks

- Removing `NotificationsProvider` from `provider-session.tsx` could affect other components if they were using it, but current grep results show it's only used by `KiloNotifications`.
- Removing message types from `extension-messages.ts` and `webview-messages.ts` must be done carefully to avoid breaking other message handlers.
