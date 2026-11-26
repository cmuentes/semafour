import { describe, expect, it } from "bun:test"
import { parseTerminalSelectionPayload } from "../../src/services/terminal-selection/payload"

describe("parseTerminalSelectionPayload", () => {
  it("rejects empty and non-text payloads", () => {
    expect(parseTerminalSelectionPayload(undefined)).toBeUndefined()
    expect(parseTerminalSelectionPayload(null)).toBeUndefined()
    expect(parseTerminalSelectionPayload("bun test")).toBeUndefined()
    expect(parseTerminalSelectionPayload(1)).toBeUndefined()
    expect(parseTerminalSelectionPayload({})).toBeUndefined()
    expect(parseTerminalSelectionPayload({ text: 1 })).toBeUndefined()
    expect(parseTerminalSelectionPayload({ text: "" })).toBeUndefined()
    expect(parseTerminalSelectionPayload({ text: "  \n\t " })).toBeUndefined()
  })

  it("keeps text verbatim and an optional terminal name", () => {
    expect(parseTerminalSelectionPayload({ text: "\nbun test\n" })).toEqual({ text: "\nbun test\n" })
    expect(parseTerminalSelectionPayload({ text: "bun test", terminalName: "zsh" })).toEqual({
      text: "bun test",
      terminalName: "zsh",
    })
    expect(parseTerminalSelectionPayload({ text: "bun test", terminalName: "" })).toEqual({ text: "bun test" })
    expect(parseTerminalSelectionPayload({ text: "bun test", terminalName: "  " })).toEqual({ text: "bun test" })
    expect(parseTerminalSelectionPayload({ text: "bun test", terminalName: 1 })).toEqual({ text: "bun test" })
  })
})
