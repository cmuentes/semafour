import * as vscode from "vscode"
import type { AgentManagerProvider } from "../../agent-manager/AgentManagerProvider"
import type { KiloProvider } from "../../KiloProvider"
import type { AddTerminalSelectionPayload } from "../../shared/terminal-selection"
import { parseTerminalSelectionPayload } from "./payload"
import { toSelection } from "./selection"

const COMMAND = "kilo-code.new.addTerminalSelectionToChat"

type Host = Pick<KiloProvider, "postMessage" | "waitForReady" | "appendTerminalSelection">
type Manager = Pick<AgentManagerProvider, "isActive" | "postMessage" | "waitForReady">
type Target = Host | Manager

function buffered(view: Target): view is Host {
  return "appendTerminalSelection" in view
}

export function terminalTarget(
  provider: Host,
  agentManager: Manager | undefined,
  activeTab: (() => Host | undefined) | undefined,
  lastFocused: (() => Target | undefined) | undefined,
): Target {
  const last = lastFocused?.()
  if (last) return last
  if (agentManager?.isActive()) return agentManager
  return activeTab?.() ?? provider
}

export async function deliverTerminalSelection(view: Target, payload: AddTerminalSelectionPayload, sidebar: Host) {
  if (!buffered(view)) {
    if (!(await view.waitForReady())) return
    const item = toSelection(payload)
    if (!item) return
    view.postMessage({ type: "addTerminalContext", ...item })
    view.postMessage({ type: "action", action: "focusInput" })
    return
  }
  if (view === sidebar) await vscode.commands.executeCommand("kilo-code.SidebarProvider.focus")
  await view.waitForReady()
  view.appendTerminalSelection(payload)
  view.postMessage({ type: "action", action: "focusInput" })
}

export function registerTerminalSelection(
  context: vscode.ExtensionContext,
  provider: KiloProvider,
  agentManager?: AgentManagerProvider,
  activeTab?: () => KiloProvider | undefined,
  lastFocused?: () => KiloProvider | AgentManagerProvider | undefined,
) {
  const attach = (payload: AddTerminalSelectionPayload) =>
    deliverTerminalSelection(terminalTarget(provider, agentManager, activeTab, lastFocused), payload, provider)

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND, async (value: unknown) => {
      const payload = parseTerminalSelectionPayload(value)
      if (!payload) return
      await attach(payload)
    }),
  )

  return { attach }
}
