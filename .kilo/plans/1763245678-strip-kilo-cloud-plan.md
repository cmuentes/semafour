# Implementation Plan: Stripping Kilo Cloud from `semafour`

This plan outlines the steps to remove proprietary Kilo Cloud features (account login, wallet/credits, `kilo-gateway` proxy) while preserving all usage statistics and telemetry UI.

## Phase 1 — Neutralize `@kilocode/kilo-gateway` Network Calls
**Goal**: Prevent outbound calls to `kilo.ai` and ensure safe fallbacks for model/pricing data.

1.  **`packages/kilo-gateway/src/api/modes.ts`**
    - Modify `fetchOrganizationModes` to return `[]` immediately if `token` is falsy.
2.  **`packages/kilo-gateway/src/api/models.ts`**
    - Modify `fetchKiloModels` to return `{ models: {} }` if `token` is falsy.
    - Modify `fetchKiloImageModels` to return `{ models: [] }` if `token` is falsy.
3.  **`packages/opencode/src/kilocode/config/config.ts`**
    - (No changes needed, it already handles empty results from `fetchOrganizationModes`).

## Phase 2 — Default Provider & Local/BYOK Routing
**Goal**: Change the default provider to `openai-compatible` and ensure local URLs work.

1.  **`packages/opencode/src/config/config.ts`**
    - Update the default provider in the configuration schema or initialization logic to `openai-compatible`.
2.  **`packages/opencode/src/provider/provider.ts`**
    - Verify that the `openai-compatible` provider handles `http://localhost` and `http://127.0.0.1` without validation errors.
3.  **`packages/opencode/src/provider/models.ts`**
    - Ensure that when a model is loaded from a local source, it has sensible defaults for `context_length` and `cost` (e.g., `cost: { input: 0, output: 0 }`) to prevent breaking usage stats.

## Phase 3 — Strip Cloud Sign-In & "Buy Credits" Upsells Only
**Goal**: Remove Kilo Cloud-specific UI elements while preserving usage statistics.

1.  **`packages/kilo-vscode/src/KiloProvider.ts`**
    - Stub `handleLogin`, `handleLogout`, `handleSetOrganization`, and `handleRefreshProfile` to do nothing or return early.
2.  **`packages/kilo-vscode/webview-ui/src/components/profile/ProfileView.tsx`**
    - Remove the "Kilo Pass" section and any "Buy Credits" or wallet balance UI.
3.  **`packages/kilo-vscode/webview-ui/src/components/profile/ProviderUsageCards.tsx`**
    - Remove the `KiloPassCard` component and its usage in `ProviderUsageCards`.
4.  **`packages/kilo-vscode/webview-ui/src/components/settings/ProviderConnectDialog.tsx`**
    - Remove the option to sign in via Kilo Cloud.
5.  **`packages/kilo-vscode/webview-ui/src/components/settings/AboutKiloCodeTab.tsx`**
    - Remove links to `kilo.ai` or Kilo Cloud documentation.
6.  **`packages/opencode/src/kilocode/components/dialog-kilo-profile.tsx`**
    - Remove the Kilo profile dialog.
7.  **`packages/opencode/src/kilocode/components/dialog-provider-usage.tsx`**
    - Remove the dialog if it is used for Kilo Cloud upsells.
