import { describe, expect, it } from "bun:test"
import {
  MAX_SELECTION_CHARS,
  activeEditorLabel,
  formatActiveEditor,
  promptWithActiveEditor,
  withoutActiveEditorBlock,
  type ActiveEditorContext,
} from "../../src/shared/active-editor-context"
import { formatCodeContext } from "../../src/shared/code-context"
import { trackable } from "../../src/services/active-editor/eligibility"
import { resolveEditor } from "../../src/services/active-editor/resolve"
import { snapshotEditor, type EditorView } from "../../src/services/active-editor/snapshot"
import {
  SELECTION_WAIT,
  ActiveEditorContextTracker,
  type EditorSource,
  type EditorView as TrackedView,
} from "../../src/services/active-editor/tracker"
import { withoutActiveFile } from "../../src/kilo-provider/active-editor-dedupe"
import { parseActiveEditor } from "../../src/kilo-provider/active-editor-message"

function view(overrides: Partial<EditorView> = {}): EditorView {
  return {
    key: "file:///tmp/App.tsx",
    scheme: "file",
    fsPath: "/tmp/App.tsx",
    name: "App.tsx",
    languageId: "typescript",
    empty: true,
    startLine: 0,
    startChar: 0,
    endLine: 0,
    endChar: 0,
    text: "",
    ...overrides,
  }
}

function file(overrides: Partial<ActiveEditorContext> = {}): ActiveEditorContext {
  return {
    filePath: "/tmp/App.tsx",
    relativePath: "src/App.tsx",
    fileName: "App.tsx",
    languageId: "typescript",
    ...overrides,
  }
}

describe("active editor formatting", () => {
  it("labels a file and a line range", () => {
    expect(activeEditorLabel(file())).toBe("App.tsx")
    expect(activeEditorLabel(file({ selection: { startLine: 14, endLine: 32, text: "const x = 1" } }))).toBe(
      "App.tsx (14-32)",
    )
  })

  it("formats a path without a selection and a fenced snippet with one", () => {
    const plain = file()
    expect(formatActiveEditor(plain)).toBe("Active file: src/App.tsx")
    const selected = file({ selection: { startLine: 14, endLine: 32, text: "const x = 1" } })
    expect(formatActiveEditor(selected)).toBe(
      formatCodeContext({
        id: "",
        filePath: "src/App.tsx",
        startLine: 14,
        endLine: 32,
        text: "const x = 1",
      }),
    )
  })

  it("caps a large selection", () => {
    const text = `${"a".repeat(MAX_SELECTION_CHARS)}TAIL`
    const formatted = formatActiveEditor(file({ selection: { startLine: 1, endLine: 1, text } }))
    expect(formatted).toContain("a".repeat(MAX_SELECTION_CHARS))
    expect(formatted).not.toContain("TAIL")
  })

  it("skips the snippet when an explicit chip already has the same range", () => {
    const selected = file({ selection: { startLine: 14, endLine: 32, text: "const x = 1" } })
    const chip = { filePath: "src/App.tsx", startLine: 14, endLine: 32, text: "const x = 1" }
    expect(promptWithActiveEditor("hello", selected, [chip])).toBe("hello")
    expect(promptWithActiveEditor("hello", selected, [])).toBe(`hello\n\n${formatActiveEditor(selected)}`)
    expect(promptWithActiveEditor("hello", file(), [])).toBe("hello\n\nActive file: src/App.tsx")
    expect(promptWithActiveEditor("hello", undefined, [])).toBe("hello")
  })

  it("removes a restored active-file block so a retry does not send it twice", () => {
    const selected = file({ selection: { startLine: 14, endLine: 32, text: "const x = 1" } })
    const sent = promptWithActiveEditor("hello", selected, [])
    expect(withoutActiveEditorBlock(sent, selected)).toBe("hello")
    expect(withoutActiveEditorBlock("hello", selected)).toBe("hello")
    expect(withoutActiveEditorBlock(sent, undefined)).toBe(sent)
  })
})

describe("editor snapshot and resolution", () => {
  it("tracks only file and untitled schemes", () => {
    expect(trackable("file")).toBe(true)
    expect(trackable("untitled")).toBe(true)
    expect(trackable("output")).toBe(false)
    expect(trackable("vscode-userdata")).toBe(false)
  })

  it("omits an empty selection and records a 1-indexed range", () => {
    expect(snapshotEditor(view(), "src/App.tsx").selection).toBeUndefined()
    const selected = snapshotEditor(
      view({
        empty: false,
        startLine: 13,
        startChar: 0,
        endLine: 32,
        endChar: 0,
        text: "picked",
      }),
      "src/App.tsx",
    )
    expect(selected.selection).toEqual({ startLine: 14, endLine: 32, text: "picked" })
    const mid = snapshotEditor(
      view({ empty: false, startLine: 13, endLine: 15, endChar: 4, text: "mid" }),
      "src/App.tsx",
    )
    expect(mid.selection?.startLine).toBe(14)
    expect(mid.selection?.endLine).toBe(16)
  })

  it("uses the untitled uri as the file path", () => {
    const snap = snapshotEditor(
      view({ key: "untitled:Untitled-1", scheme: "untitled", name: "Untitled-1", fsPath: "Untitled-1" }),
      "untitled:Untitled-1",
    )
    expect(snap.filePath).toBe("untitled:Untitled-1")
    expect(snap.fileName).toBe("Untitled-1")
    expect(snap.selection).toBeUndefined()
  })

  it("keeps the cached file when focus or a non-file pane takes over", () => {
    const open = view()
    const output = view({ key: "output:1", scheme: "output", name: "Output" })
    expect(resolveEditor(undefined, [open], open)?.key).toBe(open.key)
    expect(resolveEditor(output, [open, output], open)?.key).toBe(open.key)
    expect(resolveEditor(undefined, [output], open)).toBeUndefined()
    const other = view({ key: "file:///tmp/Other.ts", scheme: "file", name: "Other.ts" })
    expect(resolveEditor(undefined, [other], open)?.key).toBe(other.key)
    expect(resolveEditor(undefined, [], open)).toBeUndefined()
    expect(resolveEditor(other, [open, other], open)?.key).toBe(other.key)
  })
})

describe("withoutActiveFile", () => {
  it("removes the backend path only while the pill owns it", () => {
    const ctx = { activeFile: "src/App.tsx", openTabs: ["src/App.tsx"], shell: "zsh" }
    expect(withoutActiveFile(ctx, file())).toEqual({ openTabs: ["src/App.tsx"], shell: "zsh" })
    expect(withoutActiveFile(ctx, undefined)).toEqual(ctx)
    expect(withoutActiveFile({ shell: "zsh" }, file())).toEqual({ shell: "zsh" })
  })
})

describe("parseActiveEditor", () => {
  it("drops a missing or malformed payload", () => {
    expect(parseActiveEditor(undefined)).toBeUndefined()
    expect(parseActiveEditor(null)).toBeUndefined()
    expect(parseActiveEditor({ filePath: 1 })).toBeUndefined()
    expect(parseActiveEditor(file())).toEqual(file())
  })
})

function harness(opts?: { permit?: "allow" | "deny" | "gate" }) {
  const state: { active: TrackedView | undefined; visible: TrackedView[] } = { active: undefined, visible: [] }
  const activeListeners: Array<() => void> = []
  const selectionListeners: Array<(editor: TrackedView) => void> = []
  const visibleListeners: Array<() => void> = []
  const disposed: string[] = []
  const waits: number[] = []
  const pending: Array<() => void> = []
  const gates: Array<(value: boolean) => void> = []
  const mode = opts?.permit ?? "allow"
  const source: EditorSource = {
    active: () => state.active,
    visible: () => state.visible,
    onActive: (cb) => {
      activeListeners.push(cb)
      return {
        dispose: () => {
          disposed.push("active")
          const index = activeListeners.indexOf(cb)
          if (index >= 0) activeListeners.splice(index, 1)
        },
      }
    },
    onSelection: (cb) => {
      selectionListeners.push(cb)
      return {
        dispose: () => {
          disposed.push("selection")
          const index = selectionListeners.indexOf(cb)
          if (index >= 0) selectionListeners.splice(index, 1)
        },
      }
    },
    onVisible: (cb) => {
      visibleListeners.push(cb)
      return {
        dispose: () => {
          disposed.push("visible")
          const index = visibleListeners.indexOf(cb)
          if (index >= 0) visibleListeners.splice(index, 1)
        },
      }
    },
  }
  const tracker = new ActiveEditorContextTracker({
    source,
    relative: (editor) => (editor.scheme === "untitled" ? editor.key : editor.name),
    permit: () => {
      if (mode === "deny") return Promise.resolve(false)
      if (mode === "gate") return new Promise((resolve) => gates.push(resolve))
      return Promise.resolve(true)
    },
    delay: (wait, run) => {
      waits.push(wait)
      pending.push(run)
      return () => {
        const index = pending.indexOf(run)
        if (index >= 0) pending.splice(index, 1)
      }
    },
  })
  const settle = async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  }
  return {
    state,
    tracker,
    waits,
    pending,
    disposed,
    gates,
    settle,
    fireActive: () => {
      for (const cb of activeListeners) cb()
    },
    fireVisible: () => {
      for (const cb of visibleListeners) cb()
    },
    fireSelection: (editor: TrackedView) => {
      for (const cb of selectionListeners) cb(editor)
    },
    flush: () => {
      const run = pending.at(-1)
      pending.length = 0
      run?.()
    },
  }
}

describe("ActiveEditorContextTracker", () => {
  it("emits the active file immediately and keeps it when focus moves away", async () => {
    const box = harness()
    const seen: Array<ActiveEditorContext | null> = []
    box.tracker.subscribe((next) => seen.push(next))
    const open = view()
    box.state.active = open
    box.state.visible = [open]
    box.fireActive()
    await box.settle()
    expect(box.tracker.current()?.fileName).toBe("App.tsx")
    expect(box.tracker.current()?.selection).toBeUndefined()
    box.state.active = undefined
    box.fireActive()
    await box.settle()
    expect(box.tracker.current()?.fileName).toBe("App.tsx")
    expect(seen.at(-1)?.fileName).toBe("App.tsx")
  })

  it("ignores a non-file pane and clears when every file closes", async () => {
    const box = harness()
    const open = view()
    box.state.active = open
    box.state.visible = [open]
    box.fireActive()
    await box.settle()
    const output = view({ key: "output:1", scheme: "output", name: "Output" })
    box.state.active = output
    box.state.visible = [open, output]
    box.fireActive()
    await box.settle()
    expect(box.tracker.current()?.fileName).toBe("App.tsx")
    box.state.active = undefined
    box.state.visible = []
    box.fireVisible()
    await box.settle()
    expect(box.tracker.current()).toBeNull()
  })

  it("coalesces selection changes and does not re-emit an identical snapshot", async () => {
    const box = harness()
    const open = view()
    box.state.active = open
    box.state.visible = [open]
    box.fireActive()
    await box.settle()
    const seen: Array<string | undefined> = []
    box.tracker.subscribe((next) => seen.push(next?.selection?.text))
    open.empty = false
    open.text = "first"
    open.endChar = 5
    box.fireSelection(open)
    open.text = "second"
    box.fireSelection(open)
    expect(box.pending).toHaveLength(1)
    expect(box.waits.at(-1)).toBe(SELECTION_WAIT)
    box.flush()
    await box.settle()
    expect(box.tracker.current()?.selection?.text).toBe("second")
    expect(seen).toEqual(["second"])
    box.fireActive()
    await box.settle()
    expect(seen).toEqual(["second"])
  })

  it("hides a file the ignore check rejects", async () => {
    const box = harness({ permit: "deny" })
    const open = view()
    box.state.active = open
    box.state.visible = [open]
    box.fireActive()
    await box.settle()
    expect(box.tracker.current()).toBeNull()
  })

  it("drops a stale ignore result after the editor changes", async () => {
    const box = harness({ permit: "gate" })
    const first = view()
    const second = view({ key: "file:///tmp/Other.ts", fsPath: "/tmp/Other.ts", name: "Other.ts" })
    box.state.active = first
    box.state.visible = [first, second]
    box.fireActive()
    await Promise.resolve()
    box.state.active = second
    box.fireActive()
    await Promise.resolve()
    expect(box.gates).toHaveLength(2)
    box.gates[1]?.(true)
    await box.settle()
    expect(box.tracker.current()?.fileName).toBe("Other.ts")
    box.gates[0]?.(true)
    await box.settle()
    expect(box.tracker.current()?.fileName).toBe("Other.ts")
  })

  it("releases its listeners on dispose", async () => {
    const box = harness()
    const open = view()
    box.state.active = open
    box.state.visible = [open]
    box.fireActive()
    await box.settle()
    box.tracker.dispose()
    box.state.active = undefined
    box.state.visible = []
    box.fireActive()
    await box.settle()
    expect(box.tracker.current()?.fileName).toBe("App.tsx")
    expect(box.disposed.sort()).toEqual(["active", "selection", "visible"])
  })
})
