import type { ModelSelection } from "../types/messages"
import { isModelValid } from "./provider-utils"

interface Env {
  ready: unknown
  providers: Parameters<typeof isModelValid>[0]
  connected: Parameters<typeof isModelValid>[1]
  getModeModel(name: string): ModelSelection | null
}

export function warnUnavailableModels(warned: Set<string>, agents: readonly { name: string }[], env: Env) {
  if (env.ready !== true) return
  for (const agent of agents) {
    const model = env.getModeModel(agent.name)
    if (!model) continue
    const key = `${agent.name}/${model.providerID}/${model.modelID}`
    if (warned.has(key)) continue
    if (isModelValid(env.providers, env.connected, model)) continue
    warned.add(key)
    console.warn(
      `[Semafour New] Configured model for ${agent.name} is unavailable: ${model.providerID}/${model.modelID}`,
    )
  }
}
