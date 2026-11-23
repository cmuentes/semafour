// kilocode_change - new file
// Tests that the chat catalog no longer injects Semafour Gateway models, and that a configured kilo loader still autoloads.

import { expect } from "bun:test"
import { ModelsDev } from "../../src/provider/models"
import * as CoreModels from "@opencode-ai/core/models-dev"
import { Effect, Layer } from "effect"
import { kiloCustomLoaders, patchKiloProviderPrivacy } from "../../src/kilocode/provider/provider"
import { ModelCache } from "../../src/provider/model-cache"
import { TestConfig } from "../fixture/config"
import { testEffect } from "../lib/effect"
import { provideInstance, testInstanceStoreLayer } from "../fixture/fixture"

const input = {
  id: "kilo",
  name: "Semafour Gateway",
  env: ["KILO_API_KEY"],
  models: {
    "free-model": {
      id: "free-model",
      name: "Free Model",
      release_date: "",
      attachment: false,
      reasoning: false,
      temperature: true,
      tool_call: true,
      cost: { input: 0, output: 0 },
      limit: { context: 128000, output: 4096 },
    },
    "paid-model": {
      id: "paid-model",
      name: "Paid Model",
      release_date: "",
      attachment: false,
      reasoning: false,
      temperature: true,
      tool_call: true,
      cost: { input: 1, output: 2 },
      limit: { context: 128000, output: 4096 },
    },
  },
} satisfies ModelsDev.Provider

const seed: Record<string, ModelsDev.Provider> = {
  kilo: input,
  apertis: {
    id: "apertis",
    name: "Apertis",
    env: ["APERTIS_API_KEY"],
    models: {},
  },
}

function load(data?: { auth?: object; config?: object; env?: Record<string, string | undefined> }) {
  return kiloCustomLoaders({
    auth: () => Effect.succeed(data?.auth),
    config: () => Effect.succeed(data?.config ?? {}),
    env: () => Effect.succeed(data?.env ?? {}),
    get: () => Effect.succeed(undefined),
  }).kilo(input)
}

function catalogLayer(calls: string[]) {
  return Layer.fresh(ModelsDev.layer).pipe(
    Layer.provide(
      Layer.succeed(
        CoreModels.Service,
        CoreModels.Service.of({
          get: () => Effect.succeed(seed),
          refresh: () => Effect.void,
        }),
      ),
    ),
    Layer.provide(
      Layer.mock(ModelCache.Service)({
        fetch: (id: string) =>
          Effect.sync(() => {
            calls.push(id)
            return {}
          }),
        getFailure: () => Effect.succeed(undefined),
      }),
    ),
    Layer.provide(TestConfig.layer()),
  )
}

const it = testEffect(testInstanceStoreLayer)

it.live("drops the bundled Kilo catalog without fetching it", () =>
  Effect.gen(function* () {
    const calls: string[] = []
    const providers = yield* ModelsDev.Service.use((models) => models.get()).pipe(
      Effect.provide(catalogLayer(calls)),
      provideInstance(process.cwd()),
    )
    expect(providers.kilo).toBeUndefined()
    expect(calls).toEqual([])
    expect(providers.apertis?.id).toBe("apertis")
  }),
)

it.effect("enables a paid catalog anonymously without auth", () =>
  Effect.gen(function* () {
    const result = yield* load()
    expect(result.autoload).toBe(true)
    expect(result.options).toEqual({ apiKey: "anonymous" })
  }),
)

it.effect("enables a paid catalog when config apiKey is present", () =>
  Effect.gen(function* () {
    const result = yield* load({ config: { provider: { kilo: { options: { apiKey: "test-key" } } } } })
    expect(result.autoload).toBe(true)
    expect(result.options).toEqual({})
  }),
)

it.effect("denies provider data collection when prompt-training models are hidden", () =>
  Effect.gen(function* () {
    const result = yield* load({ config: { hide_prompt_training_models: true } })
    expect(result.options).toEqual({ apiKey: "anonymous", dataCollection: "deny" })
  }),
)

it.effect("keeps data collection denied after configured options are applied", () =>
  Effect.sync(() => {
    const provider = { options: { dataCollection: "allow", baseURL: "https://api.kilo.ai" } }
    patchKiloProviderPrivacy(provider, { hide_prompt_training_models: true })
    expect(provider.options).toEqual({ dataCollection: "deny", baseURL: "https://api.kilo.ai" })
  }),
)

it.effect("enables a paid catalog when auth exists", () =>
  Effect.gen(function* () {
    const result = yield* load({ auth: { type: "api", key: "test-key" } })
    expect(result.autoload).toBe(true)
    expect(result.options).toEqual({})
  }),
)
