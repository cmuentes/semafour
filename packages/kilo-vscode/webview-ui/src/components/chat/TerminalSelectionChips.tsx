import { For, Show, type Component } from "solid-js"
import { Icon } from "@kilocode/kilo-ui/icon"
import { Tooltip } from "@kilocode/kilo-ui/tooltip"
import type { TerminalSelection } from "../../../../src/shared/terminal-selection"
import { useLanguage } from "../../context/language"
import { promptLineCount } from "./prompt-input-utils"

const PREVIEW = 240

interface TerminalSelectionChipsProps {
  items: TerminalSelection[]
  onRemove?: (id: string) => void
}

export const TerminalSelectionChips: Component<TerminalSelectionChipsProps> = (props) => {
  const language = useLanguage()
  const label = (item: TerminalSelection) => {
    const name = item.terminalName?.trim() || language.t("ui.promptInput.terminal")
    const lines = language.t("ui.promptInput.terminalLines", { count: promptLineCount(item.text) })
    return `${name} · ${lines}`
  }
  const preview = (text: string) => {
    const value = text.trim()
    return value.length > PREVIEW ? `${value.slice(0, PREVIEW)}…` : value
  }

  return (
    <div class="terminal-selection-pills" data-component="terminal-selection">
      <For each={props.items}>
        {(item) => (
          <div class="terminal-selection-pill">
            <Tooltip value={preview(item.text)} placement="top">
              <span class="terminal-selection-pill-main">
                <Icon name="terminal" size="small" />
                <span class="prompt-review-row-label">{label(item)}</span>
              </span>
            </Tooltip>
            <Show when={props.onRemove}>
              <button
                type="button"
                class="prompt-review-row-remove"
                aria-label={language.t("common.delete")}
                onClick={() => props.onRemove?.(item.id)}
              >
                ×
              </button>
            </Show>
          </div>
        )}
      </For>
    </div>
  )
}
