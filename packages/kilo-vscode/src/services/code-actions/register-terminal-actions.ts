import * as vscode from "vscode"
import type { KiloProvider } from "../../KiloProvider"
import type { AgentManagerProvider } from "../../agent-manager/AgentManagerProvider"
import { createPrompt } from "./support-prompt"
import { getTerminalContents } from "../terminal/context"
import { parseTerminalSelectionPayload } from "../terminal-selection/payload"
import { deliverTerminalSelection, terminalTarget } from "../terminal-selection/register"

export function registerTerminalActions(
  context: vscode.ExtensionContext,
  provider: KiloProvider,
  agentManager?: AgentManagerProvider,
  activeTab?: () => KiloProvider | undefined,
  lastFocused?: () => KiloProvider | AgentManagerProvider | undefined,
): void {
  const target = () => (agentManager?.isActive() ? agentManager : provider)
  const selectionTarget = () => terminalTarget(provider, agentManager, activeTab, lastFocused)
  const reveal = async () => {
    await vscode.commands.executeCommand("kilo-code.SidebarProvider.focus")
    await provider.waitForReady()
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("kilo-code.new.terminalAddToContext", async (args?: { selection?: string }) => {
      const content = args?.selection ? args.selection : (await getTerminalContents(-1)).content
      const payload = parseTerminalSelectionPayload({
        text: content,
        terminalName: vscode.window.activeTerminal?.name,
      })
      if (!payload) {
        vscode.window.showInformationMessage("No terminal content available. Select text in the terminal first.")
        return
      }
      await deliverTerminalSelection(selectionTarget(), payload, provider)
    }),

    vscode.commands.registerCommand("kilo-code.new.terminalFixCommand", async (args: any) => {
      let content = args?.selection as string | undefined
      if (!content) {
        content = (await getTerminalContents(1)).content
      }
      if (!content) {
        vscode.window.showInformationMessage("No terminal content available. Select text in the terminal first.")
        return
      }
      const prompt = createPrompt("TERMINAL_FIX", {
        terminalContent: content,
        userInput: "",
      })
      const view = target()
      if (view === provider) {
        await reveal()
      }
      view.postMessage({ type: "triggerTask", text: prompt, injectedTitle: "Fix terminal command" })
    }),

    vscode.commands.registerCommand("kilo-code.new.terminalExplainCommand", async (args: any) => {
      let content = args?.selection as string | undefined
      if (!content) {
        content = (await getTerminalContents(1)).content
      }
      if (!content) {
        vscode.window.showInformationMessage("No terminal content available. Select text in the terminal first.")
        return
      }
      const prompt = createPrompt("TERMINAL_EXPLAIN", {
        terminalContent: content,
        userInput: "",
      })
      const view = target()
      if (view === provider) {
        await reveal()
      }
      view.postMessage({ type: "triggerTask", text: prompt, injectedTitle: "Explain terminal command" })
    }),
  )
}
