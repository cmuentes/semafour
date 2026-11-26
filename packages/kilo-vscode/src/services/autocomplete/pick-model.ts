import type { KiloConnectionService } from "../cli-backend"
import { genericAutocompleteModel, getAutocompleteModel } from "../../shared/autocomplete-models"

export type ConnectedModel = {
  id: string
  name?: string
  model?: string
  npm?: string
}

export type PickedModel = {
  provider: string
  model: string
  usable: boolean
}

let current: { provider?: string; model?: string } | undefined

export function rememberSelection(provider?: string, model?: string) {
  current = { provider, model }
}

export function rememberedSelection() {
  return current
}

export function pickAutocomplete(input: {
  provider?: string
  model?: string
  kilo: boolean
  connected: readonly ConnectedModel[]
}): PickedModel {
  const chosen = input.provider?.trim()
  if (chosen === "kilo") {
    const info = getAutocompleteModel("kilo", input.model)
    return { provider: info.providerID, model: info.modelID, usable: input.kilo }
  }
  if (chosen) {
    const info = getAutocompleteModel(chosen, input.model)
    const live = input.connected.find((item) => item.id === info.providerID)
    if (live?.model && !info.modelID) {
      const fallback = genericAutocompleteModel(live.id, live.model, live.name)
      return { provider: fallback.providerID, model: fallback.modelID, usable: true }
    }
    return { provider: info.providerID, model: info.modelID, usable: !!live }
  }
  if (input.kilo) {
    const info = getAutocompleteModel(undefined, input.model)
    return { provider: info.providerID, model: info.modelID, usable: true }
  }
  const local = input.connected.find(
    (item) => item.id !== "kilo" && item.npm === "@ai-sdk/openai-compatible" && item.model,
  )
  const alt = local ?? input.connected.find((item) => item.id !== "kilo" && item.model)
  if (alt?.model) {
    const info = genericAutocompleteModel(alt.id, alt.model, alt.name)
    return { provider: info.providerID, model: info.modelID, usable: true }
  }
  const info = getAutocompleteModel(undefined, input.model)
  return { provider: info.providerID, model: info.modelID, usable: false }
}

function offline(provider?: string, model?: string): PickedModel {
  const info = getAutocompleteModel(provider, model)
  return { provider: info.providerID, model: info.modelID, usable: false }
}

type ListedProvider = {
  id: string
  name?: string
  models?: Record<string, { api?: { npm?: string } }>
}

function fromList(listed: unknown): ConnectedModel[] {
  const data = (
    listed as { data?: { all?: ListedProvider[]; connected?: string[]; default?: Record<string, string> } } | undefined
  )?.data
  if (!data?.connected) return []
  return data.connected.flatMap((id) => {
    if (id === "kilo") return []
    const provider = data.all?.find((item) => item.id === id)
    const model = data.default?.[id] ?? Object.keys(provider?.models ?? {}).at(0)
    if (!model) return []
    return [{ id, name: provider?.name, model, npm: provider?.models?.[model]?.api?.npm }]
  })
}

export async function resolveAutocomplete(
  connection: KiloConnectionService,
  provider?: string,
  model?: string,
): Promise<PickedModel> {
  if (connection.getConnectionState() !== "connected" || typeof connection.getClientAsync !== "function") {
    return offline(provider, model)
  }
  const client = await connection.getClientAsync().catch((err: unknown) => {
    console.error("[FIM] failed to read configured providers", err)
    return undefined
  })
  if (!client) return offline(provider, model)
  const [listed, status] = await Promise.all([
    client.provider.list().catch((err: unknown) => {
      console.error("[FIM] failed to list providers", err)
      return undefined
    }),
    client.kilo.authStatus().catch((err: unknown) => {
      console.error("[FIM] failed to read Semafour auth", err)
      return undefined
    }),
  ])
  return pickAutocomplete({
    provider,
    model,
    kilo: status?.data?.authenticated === true,
    connected: fromList(listed),
  })
}
