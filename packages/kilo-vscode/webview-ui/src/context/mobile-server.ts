import { createSignal, onCleanup, onMount } from "solid-js"
import { useVSCode } from "./vscode"

type State = { running: boolean; urls: string[]; error?: string }

/**
 * Shared mobile bridge server state for a webview. The extension host owns one
 * singleton server; every live webview mirrors its state via the `mobileServerState`
 * broadcast so all TaskHeader toggles agree.
 */
export function useMobileServer() {
  const vscode = useVSCode()
  const [state, setState] = createSignal<State>({ running: false, urls: [] })

  const release = vscode.onMessage((message) => {
    if (message.type !== "mobileServerState") return
    setState({ running: message.running, urls: message.urls, error: message.error })
  })
  onCleanup(release)

  onMount(() => vscode.postMessage({ type: "requestMobileServerState" }))

  return {
    running: () => state().running,
    urls: () => state().urls,
    error: () => state().error,
    toggle: () => vscode.postMessage({ type: "toggleMobileServer" }),
  }
}
