import { describe, expect, it } from "bun:test"
import {
  AUTOCOMPLETE_SELECTOR_MODELS,
  autocompleteSelectorModels,
} from "../../webview-ui/src/components/settings/autocomplete-model-selector"
import { AUTOCOMPLETE_MODELS } from "../../src/shared/autocomplete-models"
import type { EnrichedModel } from "../../webview-ui/src/context/provider"

describe("autocomplete model selector", () => {
  it("shows autocomplete models grouped by their configured provider", () => {
    expect(AUTOCOMPLETE_SELECTOR_MODELS).toEqual(
      AUTOCOMPLETE_MODELS.map((m) => ({
        id: m.modelID,
        name: m.label,
        providerID: m.providerID,
        providerName: m.provider,
      })),
    )
  })

  it("keeps connected presets first and adds every other connected model", () => {
    const local: EnrichedModel = {
      id: "qwen",
      name: "Qwen",
      providerID: "llama",
      providerName: "llama.cpp",
    }
    const selected = autocompleteSelectorModels(
      [
        local,
        { id: "codestral-2508", name: "Codestral raw", providerID: "mistral", providerName: "Mistral" },
        { id: "kilo-auto/small", name: "Small", providerID: "kilo", providerName: "Semafour Gateway" },
      ],
      ["kilo", "mistral", "llama"],
    )
    expect(selected[0]).toMatchObject({ providerID: "mistral", id: "codestral-2508", name: "Codestral" })
    expect(selected.some((item) => item.providerID === "kilo")).toBe(false)
    expect(selected.at(-1)).toEqual(local)
  })
})
