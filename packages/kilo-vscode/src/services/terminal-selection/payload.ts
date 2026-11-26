import type { AddTerminalSelectionPayload } from "../../shared/terminal-selection"

export function parseTerminalSelectionPayload(value: unknown): AddTerminalSelectionPayload | undefined {
  if (value == null || typeof value !== "object") return
  const text = (value as { text?: unknown }).text
  if (typeof text !== "string" || text.trim().length === 0) return
  const name = (value as { terminalName?: unknown }).terminalName
  if (typeof name !== "string" || name.trim().length === 0) return { text }
  return { text, terminalName: name }
}
