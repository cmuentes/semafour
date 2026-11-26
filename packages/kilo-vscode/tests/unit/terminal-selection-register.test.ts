import { afterEach, describe, expect, it } from "bun:test"
import * as vscode from "vscode"
import { registerTerminalSelection } from "../../src/services/terminal-selection/register"
import { registerTerminalActions } from "../../src/services/code-actions/register-terminal-actions"

type Command = (...args: unknown[]) => unknown

type Api = typeof vscode & {
  commands: {
    registerCommand: (command: string, callback: Command) => { dispose(): void }
    executeCommand: (...args: unknown[]) => Promise<void>
  }
}

const api = vscode as Api
const original = {
  register: api.commands.registerCommand,
  execute: api.commands.executeCommand,
}

function setup(active = false, ready = true) {
  const commands = new Map<string, Command>()
  const executed: unknown[][] = []
  const events: string[] = []
  const posts: unknown[] = []
  const context = { subscriptions: [] as Array<{ dispose(): void }> } as vscode.ExtensionContext
  const provider = {
    postMessage: (msg: unknown) => {
      events.push("post")
      posts.push(msg)
    },
    waitForReady: async () => {
      events.push("wait")
    },
    appendTerminalSelection: (payload: { text: string; terminalName?: string }) => {
      events.push("post")
      posts.push({ type: "addTerminalContext", text: payload.text, terminalName: payload.terminalName })
    },
  }
  const agent = {
    isActive: () => active,
    postMessage: (msg: unknown) => {
      events.push("post")
      posts.push(msg)
    },
    waitForReady: async () => {
      events.push("wait")
      return ready
    },
  }

  api.commands.registerCommand = (command, callback) => {
    commands.set(command, callback)
    return { dispose: () => undefined }
  }
  api.commands.executeCommand = async (...args) => {
    events.push("focus")
    executed.push(args)
  }

  registerTerminalSelection(context, provider as never, agent as never)
  registerTerminalActions(context, provider as never, agent as never)

  return { commands, events, executed, posts }
}

afterEach(() => {
  api.commands.registerCommand = original.register
  api.commands.executeCommand = original.execute
})

describe("addTerminalSelectionToChat", () => {
  it("ignores an empty payload without focusing the chat", async () => {
    const state = setup()
    await state.commands.get("kilo-code.new.addTerminalSelectionToChat")?.({ text: " \n\t " })
    await state.commands.get("kilo-code.new.addTerminalSelectionToChat")?.(undefined)
    expect(state.events).toEqual([])
    expect(state.posts).toEqual([])
  })

  it("focuses the sidebar, then posts the selection and focuses the input", async () => {
    const state = setup()
    await state.commands.get("kilo-code.new.addTerminalSelectionToChat")?.({ text: "bun test", terminalName: "zsh" })
    expect(state.events).toEqual(["focus", "wait", "post", "post"])
    expect(state.executed).toEqual([["kilo-code.SidebarProvider.focus"]])
    expect(state.posts).toEqual([
      { type: "addTerminalContext", text: "bun test", terminalName: "zsh" },
      { type: "action", action: "focusInput" },
    ])
  })

  it("posts to the active Agent Manager only after it is ready", async () => {
    const open = setup(true, true)
    await open.commands.get("kilo-code.new.addTerminalSelectionToChat")?.({ text: "bun test" })
    expect(open.events).toEqual(["wait", "post", "post"])
    expect(open.executed).toEqual([])
    expect(open.posts[0]).toMatchObject({ type: "addTerminalContext", text: "bun test" })
    expect(typeof (open.posts[0] as { id: string }).id).toBe("string")
    expect(open.posts[1]).toEqual({ type: "action", action: "focusInput" })

    const closed = setup(true, false)
    await closed.commands.get("kilo-code.new.addTerminalSelectionToChat")?.({ text: "bun test" })
    expect(closed.events).toEqual(["wait"])
    expect(closed.posts).toEqual([])
  })

  it("migrates terminalAddToContext onto the same pill message", async () => {
    const state = setup()
    await state.commands.get("kilo-code.new.terminalAddToContext")?.({ selection: "bun test" })
    expect(state.posts.map((item) => (item as { type: string }).type)).toEqual(["addTerminalContext", "action"])
    expect(JSON.stringify(state.posts)).not.toContain("appendChatBoxMessage")
  })
})
