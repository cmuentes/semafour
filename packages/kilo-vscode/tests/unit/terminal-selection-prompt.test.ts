import { describe, expect, it } from "bun:test"
import { formatTerminalSelection, formatTerminalSelections } from "../../src/shared/terminal-selection-prompt"

describe("formatTerminalSelections", () => {
  it("formats one snippet with and without a name", () => {
    expect(formatTerminalSelection({ text: "bun test", terminalName: "zsh" })).toBe(
      '<terminal_selection name="zsh">\nbun test\n</terminal_selection>',
    )
    expect(formatTerminalSelection({ text: "bun test" })).toBe("<terminal_selection>\nbun test\n</terminal_selection>")
  })

  it("joins several snippets and emits nothing when none are attached", () => {
    expect(formatTerminalSelections([{ text: "one", terminalName: "zsh" }, { text: "two" }])).toBe(
      '<terminal_selection name="zsh">\none\n</terminal_selection>\n\n<terminal_selection>\ntwo\n</terminal_selection>',
    )
    expect(formatTerminalSelections([])).toBe("")
  })

  it("escapes a quote in the name and a closing tag in the body", () => {
    expect(formatTerminalSelection({ text: "ok", terminalName: 'my "term"' })).toBe(
      '<terminal_selection name="my &quot;term&quot;">\nok\n</terminal_selection>',
    )
    expect(formatTerminalSelection({ text: "see </terminal_selection> here" })).toBe(
      "<terminal_selection>\nsee <\\/terminal_selection> here\n</terminal_selection>",
    )
  })
})
