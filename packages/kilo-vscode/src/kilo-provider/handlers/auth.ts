/**
 * Authentication handlers — extracted from KiloProvider.
 *
 * Semafour Cloud sign-in has been removed: these handlers are stubs that return
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

/** Semafour Cloud login is disabled. */
export async function handleLogin(_ctx: AuthContext, _attempt: number, _getAttempt: () => number): Promise<void> {
  return
}

/** Semafour Cloud logout is disabled. */
export async function handleLogout(_ctx: AuthContext): Promise<void> {
  return
}

/** Semafour Cloud organization switching is disabled. */
export async function handleSetOrganization(_ctx: AuthContext, _organizationId: string | null): Promise<void> {
  return
}

/** Semafour Cloud profile refresh is disabled. */
export async function handleRefreshProfile(_ctx: AuthContext): Promise<void> {
  return
}
