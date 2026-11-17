# Add total tokens per session to conversation history

This plan implements the addition of total token usage (input + output + reasoning) to each session entry in the conversation history view on the profile page.

## Context

The profile page's history view currently displays the session title and the relative date of the last update. Users want to see the total tokens used in each session to track their usage. Token usage data is already being tracked and is available in the `SessionContext` via the `modelUsage` accessor (for the current session) and in the `store.modelUsage` map (for all sessions).

## Implementation Plan

### 1. Update Types
- Modify `packages/kilo-vscode/webview-ui/src/context/session-types.ts` to add `modelUsageMap: Accessor<Record<string, SessionModelUsage>>` to the `SessionContextValue` interface.

### 2. Update Session Context
- Modify `packages/kilo-vscode/webview-ui/src/context/session.tsx`:
  - Create a new memo `modelUsageMap` within `SessionProvider` that derives a `Record<string, SessionModelUsage>` from `store.modelUsage`. It will extract the `data` property from each entry in the store.
  - Expose `modelUsageMap` in the `SessionProvider` return object.

### 3. Update History View UI
- Modify `packages/kilo-vscode/webview-ui/src/components/history/SessionList.tsx`:
  - Import `formatCompactCount` from `../../utils/format`.
  - Import `SessionModelUsage` from `../../types/messages`.
  - In the list item rendering function, look up the usage for the current session `s` using `session.modelUsageMap()[s.id]`.
  - If usage exists, calculate `totalTokens = usage.totals.tokens.input + usage.totals.tokens.output + (usage.totals.tokens.reasoning ?? 0)`.
  - Update the `list-item-description` span to include the formatted token count (e.g., "1.2K tokens") if `totalTokens > 0`, separated from the date by a middle dot (` · `).

## Validation Plan

- Verify that the profile page's history view correctly displays the total tokens for sessions that have usage data.
- Verify that sessions with no usage data only show the relative date.
- Verify that the token count is correctly formatted using `formatCompactCount` (e.g., "1K", "1.5K", "1M").
- Ensure that the new token count is correctly updated when session usage changes.
