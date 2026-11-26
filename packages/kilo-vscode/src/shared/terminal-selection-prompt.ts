import type { TerminalSelection } from "./terminal-selection"

const CLOSE = "</terminal_selection>"

function escapeName(name: string): string {
  return name.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;")
}

function escapeBody(text: string): string {
  return text.replaceAll(CLOSE, "<\\/terminal_selection>")
}

export function formatTerminalSelection(item: Pick<TerminalSelection, "text" | "terminalName">): string {
  const name = item.terminalName?.trim()
  const open = name ? `<terminal_selection name="${escapeName(name)}">` : "<terminal_selection>"
  return `${open}\n${escapeBody(item.text)}\n${CLOSE}`
}

export function formatTerminalSelections(items: readonly Pick<TerminalSelection, "text" | "terminalName">[]): string {
  if (items.length === 0) return ""
  return items.map(formatTerminalSelection).join("\n\n")
}
