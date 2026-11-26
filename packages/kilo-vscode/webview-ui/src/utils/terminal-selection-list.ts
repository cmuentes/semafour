import type { TerminalSelection } from "../../../src/shared/terminal-selection"

export function addTerminalSelection(
  current: readonly TerminalSelection[],
  next: TerminalSelection,
): TerminalSelection[] {
  if (current.some((item) => item.id === next.id)) return [...current]
  return [...current, next]
}

export function removeTerminalSelection(current: readonly TerminalSelection[], id: string): TerminalSelection[] {
  return current.filter((item) => item.id !== id)
}

export function clearTerminalSelections(): TerminalSelection[] {
  return []
}
