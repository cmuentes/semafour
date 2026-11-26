import { describe, expect, it } from "bun:test"
import type { TerminalSelection } from "../../src/shared/terminal-selection"
import {
  addTerminalSelection,
  clearTerminalSelections,
  removeTerminalSelection,
} from "../../webview-ui/src/utils/terminal-selection-list"

const first: TerminalSelection = { id: "a", text: "one", terminalName: "zsh" }
const second: TerminalSelection = { id: "b", text: "two" }
const editor = { file: "src/App.tsx" }

describe("terminal selection list", () => {
  it("adds several snippets and ignores a duplicate id", () => {
    const added = addTerminalSelection(addTerminalSelection([], first), second)
    expect(added).toEqual([first, second])
    expect(addTerminalSelection(added, { ...first, text: "changed" })).toEqual([first, second])
  })

  it("removes one snippet by id and clears the list", () => {
    const added = [first, second]
    expect(removeTerminalSelection(added, "a")).toEqual([second])
    expect(removeTerminalSelection(added, "missing")).toEqual(added)
    expect(clearTerminalSelections()).toEqual([])
  })

  it("does not read or change an active editor value", () => {
    const added = addTerminalSelection([first], second)
    expect(editor).toEqual({ file: "src/App.tsx" })
    expect(added).toEqual([first, second])
  })
})
