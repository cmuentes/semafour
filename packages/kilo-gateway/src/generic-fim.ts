export type GenericEndpoint = { baseURL: string; model: string; key?: string } | { error: string }

export type GenericFimInput = {
  baseURL: string
  model: string
  prefix: string
  suffix: string
  maxTokens: number
  temperature: number
  signal?: AbortSignal
  key?: string
  headers?: Record<string, string>
}

const chatOnly = new Set<string>()

export function clearGenericFimCache() {
  chatOnly.clear()
}

function text(value: unknown) {
  if (typeof value !== "string") return
  const next = value.trim()
  if (!next) return
  return next
}

export function resolveGenericEndpoint(input: {
  model: string
  key?: string
  apiKey?: unknown
  baseURL?: unknown
  apiURL?: unknown
  apiModel?: unknown
}): GenericEndpoint {
  const base = text(input.baseURL) ?? text(input.apiURL)
  if (!base) return { error: `Provider has no endpoint for ${input.model}` }
  const key = text(input.apiKey) ?? text(input.key)
  const model = text(input.apiModel) ?? input.model
  return { baseURL: base, model, ...(key ? { key } : {}) }
}

function join(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path}`
}

function unsupported(status: number) {
  return status === 404 || status === 405 || status === 501
}

function completionsBody(input: GenericFimInput) {
  return {
    model: input.model,
    prompt: input.prefix,
    suffix: input.suffix,
    max_tokens: input.maxTokens,
    temperature: input.temperature,
    stream: true,
  }
}

function chatBody(input: GenericFimInput) {
  const content = [
    "Fill in the code at the cursor. Reply with only the missing code.",
    "<prefix>",
    input.prefix,
    "</prefix>",
    "<suffix>",
    input.suffix,
    "</suffix>",
  ].join("\n")
  return {
    model: input.model,
    messages: [{ role: "user", content }],
    max_tokens: input.maxTokens,
    temperature: input.temperature,
    stream: true,
  }
}

async function post(url: string, body: unknown, input: GenericFimInput) {
  console.info(`[FIM] request provider=generic model=${input.model} url=${url}`)
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...input.headers,
      ...(input.key ? { Authorization: `Bearer ${input.key}` } : {}),
    },
    signal: input.signal,
    body: JSON.stringify(body),
  })
}

async function drain(response: Response) {
  await response.arrayBuffer().catch((err: unknown) => {
    console.error("[FIM] failed to discard unsupported completions response", err)
  })
}

export async function requestGenericFim(input: GenericFimInput): Promise<Response> {
  const base = input.baseURL.replace(/\/+$/, "")
  if (!chatOnly.has(base)) {
    const first = await post(join(base, "completions"), completionsBody(input), input)
    if (first.ok || !unsupported(first.status)) return first
    await drain(first)
    chatOnly.add(base)
  }
  return post(join(base, "chat/completions"), chatBody(input), input)
}
