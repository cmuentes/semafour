import { describe, expect, it } from "bun:test"
import { pickAutocomplete } from "../../src/services/autocomplete/pick-model"
import { DEFAULT_AUTOCOMPLETE_MODEL } from "../../src/shared/autocomplete-models"

const llama = { id: "llama", name: "llama.cpp", model: "qwen", npm: "@ai-sdk/openai-compatible" }

describe("pickAutocomplete", () => {
  it("keeps the Semafour default when signed in and nothing is selected", () => {
    expect(pickAutocomplete({ kilo: true, connected: [llama] })).toEqual({
      provider: DEFAULT_AUTOCOMPLETE_MODEL.providerID,
      model: DEFAULT_AUTOCOMPLETE_MODEL.modelID,
      usable: true,
    })
  })

  it("uses a configured local provider when Semafour is not signed in", () => {
    expect(pickAutocomplete({ kilo: false, connected: [llama] })).toEqual({
      provider: "llama",
      model: "qwen",
      usable: true,
    })
  })

  it("fills an empty model from the configured provider", () => {
    expect(pickAutocomplete({ provider: "llama", kilo: false, connected: [llama] })).toEqual({
      provider: "llama",
      model: "qwen",
      usable: true,
    })
  })

  it("keeps an explicit configured provider", () => {
    expect(
      pickAutocomplete({
        provider: "openai",
        model: "gpt-4o",
        kilo: false,
        connected: [{ id: "openai", model: "gpt-4o" }],
      }),
    ).toEqual({
      provider: "openai",
      model: "gpt-4o",
      usable: true,
    })
  })

  it("does not treat an unconfigured explicit provider as usable", () => {
    expect(pickAutocomplete({ provider: "openai", model: "gpt-4o", kilo: false, connected: [] })).toEqual({
      provider: "openai",
      model: "gpt-4o",
      usable: false,
    })
  })

  it("reports Semafour as unusable when it was chosen explicitly and the user is signed out", () => {
    expect(
      pickAutocomplete({ provider: "kilo", model: "inception/mercury-next-edit", kilo: false, connected: [llama] }),
    ).toEqual({
      provider: "kilo",
      model: "inception/mercury-next-edit",
      usable: false,
    })
  })

  it("leaves Next Edit available for Inception and routes other models to classic FIM", () => {
    const inception = pickAutocomplete({
      provider: "inception",
      model: "mercury-next-edit",
      kilo: false,
      connected: [{ id: "inception", model: "mercury-next-edit" }],
    })
    expect(inception).toEqual({ provider: "inception", model: "mercury-next-edit", usable: true })
    const local = pickAutocomplete({ provider: "llama", model: "qwen", kilo: false, connected: [llama] })
    expect(local.provider).toBe("llama")
    expect(local.model).toBe("qwen")
  })
})
