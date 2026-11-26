import { describe, expect, test } from "bun:test"
import {
  AUTOCOMPLETE_MODELS,
  DEFAULT_AUTOCOMPLETE_MODEL,
  DEFAULT_AUTOCOMPLETE_MODEL_ID,
  DEFAULT_AUTOCOMPLETE_PROVIDER_ID,
  genericAutocompleteModel,
  getAutocompleteModel,
  getAutocompleteModelById,
} from "../src/autocomplete"

describe("DEFAULT_AUTOCOMPLETE_MODEL", () => {
  test("resolves to Mercury Next Edit through Semafour Gateway", () => {
    const match = AUTOCOMPLETE_MODELS.find(
      (m) => m.providerID === DEFAULT_AUTOCOMPLETE_PROVIDER_ID && m.modelID === DEFAULT_AUTOCOMPLETE_MODEL_ID,
    )
    expect(DEFAULT_AUTOCOMPLETE_PROVIDER_ID).toBe("kilo")
    expect(DEFAULT_AUTOCOMPLETE_MODEL_ID).toBe("inception/mercury-next-edit")
    expect(match).toBeDefined()
    expect(DEFAULT_AUTOCOMPLETE_MODEL).toBe(match!)
    expect(DEFAULT_AUTOCOMPLETE_MODEL.kind).toBe("edit")
  })
})

describe("configured providers", () => {
  test("keeps Mercury Next Edit on Semafour and Inception only", () => {
    const edits = AUTOCOMPLETE_MODELS.filter((model) => model.kind === "edit")
    expect(edits.map((model) => model.providerID).sort()).toEqual(["inception", "kilo"])
    expect(getAutocompleteModel("inception", "mercury-next-edit").kind).toBe("edit")
    expect(getAutocompleteModel("kilo", "inception/mercury-next-edit").kind).toBe("edit")
  })

  test("routes an unknown provider to classic FIM instead of Next Edit", () => {
    const model = getAutocompleteModel("llama", "qwen2.5-coder")
    expect(model).toEqual(genericAutocompleteModel("llama", "qwen2.5-coder"))
    expect(model.kind).not.toBe("edit")
    expect(getAutocompleteModelById("llama/qwen2.5-coder").modelID).toBe("qwen2.5-coder")
  })
})

describe("Next Edit FIM models", () => {
  test("reference a FIM model from the same provider", () => {
    for (const model of AUTOCOMPLETE_MODELS) {
      if (model.kind !== "edit") continue
      const sibling = AUTOCOMPLETE_MODELS.find((candidate) => candidate.id === model.fimModelID)
      expect(sibling).toBeDefined()
      expect(sibling?.kind).not.toBe("edit")
      expect(sibling?.providerID).toBe(model.providerID)
    }
  })
})
