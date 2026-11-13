/**
 * Authentication handlers — extracted from KiloProvider.
 *
 * Kilo Cloud sign-in has been removed: these handlers are stubs that return
 * early so any residual webview auth requests become no-ops.
 */

import type { KiloClient } from "@kilocode/sdk/v2/client"

export interface AuthContext {
  readonly client: KiloClient | null
  postMessage(msg: unknown): void
  getWorkspaceDirectory(): string
  disposeGlobal(): Promise<void>
  invalidateProviderUsage(): void
  invalidateProviders(): void
  fetchAndSendProviders(): Promise<void>
  fetchAndSendAgents(): Promise<void>
  fetchAndSendSpeechToTextModels(): Promise<void>
}

/** Kilo Cloud login is disabled. */
export async function handleLogin(_ctx: AuthContext, _attempt: number, _getAttempt: () => number): Promise<void> {
  return
}

/** Kilo Cloud logout is disabled. */
export async function handleLogout(_ctx: AuthContext): Promise<void> {
  return
}

/** Kilo Cloud organization switching is disabled. */
export async function handleSetOrganization(_ctx: AuthContext, _organizationId: string | null): Promise<void> {
  return
}

/** Kilo Cloud profile refresh is disabled. */
export async function handleRefreshProfile(_ctx: AuthContext): Promise<void> {
  return
}
