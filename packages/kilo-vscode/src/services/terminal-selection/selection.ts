import { truncateTerminalOutput } from "../terminal/truncate"
import type { AddTerminalSelectionPayload, TerminalSelection } from "../../shared/terminal-selection"

export function toSelection(
  payload: AddTerminalSelectionPayload,
  id = crypto.randomUUID(),
): TerminalSelection | undefined {
  const text = truncateTerminalOutput(payload.text).content
  if (!text.trim()) return
  if (!payload.terminalName) return { id, text }
  return { id, text, terminalName: payload.terminalName }
}
