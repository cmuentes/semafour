import { afterEach, describe, expect, test } from "bun:test"
import { clearGenericFimCache, requestGenericFim, resolveGenericEndpoint } from "../src/generic-fim"

afterEach(() => {
  clearGenericFimCache()
})

describe("resolveGenericEndpoint", () => {
  test("uses a base URL without an API key", () => {
    expect(
      resolveGenericEndpoint({
        model: "qwen",
        baseURL: "http://127.0.0.1:8080/v1",
      }),
    ).toEqual({
      baseURL: "http://127.0.0.1:8080/v1",
      model: "qwen",
    })
  })

  test("prefers the configured base URL and API model id", () => {
    expect(
      resolveGenericEndpoint({
        model: "local",
        apiKey: "secret",
        baseURL: "http://127.0.0.1:8080/v1",
        apiURL: "https://api.example.com/v1",
        apiModel: "qwen2.5-coder",
      }),
    ).toEqual({
      baseURL: "http://127.0.0.1:8080/v1",
      key: "secret",
      model: "qwen2.5-coder",
    })
  })

  test("fails when the provider has no endpoint", () => {
    expect(resolveGenericEndpoint({ model: "qwen" })).toEqual({ error: "Provider has no endpoint for qwen" })
  })
})

describe("requestGenericFim", () => {
  test("streams a completion from a local OpenAI-compatible server without a key", async () => {
    let auth: string | null = null
    let body: { prompt?: string; suffix?: string; model?: string } = {}
    const server = Bun.serve({
      port: 0,
      async fetch(req) {
        auth = req.headers.get("authorization")
        body = (await req.json()) as typeof body
        return new Response(`data: ${JSON.stringify({ choices: [{ text: "next" }] })}\n\n`, {
          headers: { "Content-Type": "text/event-stream" },
        })
      },
    })
    try {
      const response = await requestGenericFim({
        baseURL: `http://127.0.0.1:${server.port}/v1`,
        model: "qwen",
        prefix: "const value = ",
        suffix: "\n",
        maxTokens: 16,
        temperature: 0.2,
      })
      expect(response.ok).toBe(true)
      expect(auth).toBeNull()
      expect(body.model).toBe("qwen")
      expect(body.prompt).toBe("const value = ")
      expect(body.suffix).toBe("\n")
      expect(await response.text()).toContain("next")
    } finally {
      server.stop(true)
    }
  })

  test("falls back to chat completions when the native endpoint is missing", async () => {
    const paths: string[] = []
    const server = Bun.serve({
      port: 0,
      async fetch(req) {
        const url = new URL(req.url)
        paths.push(url.pathname)
        if (url.pathname.endsWith("/completions") && !url.pathname.endsWith("/chat/completions")) {
          return new Response("missing", { status: 404 })
        }
        return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: "chat" } }] })}\n\n`, {
          headers: { "Content-Type": "text/event-stream" },
        })
      },
    })
    try {
      const response = await requestGenericFim({
        baseURL: `http://127.0.0.1:${server.port}/v1`,
        model: "gpt",
        prefix: "fn ",
        suffix: "",
        maxTokens: 8,
        temperature: 0,
        key: "secret",
      })
      expect(response.ok).toBe(true)
      expect(paths).toEqual(["/v1/completions", "/v1/chat/completions"])
      expect(await response.text()).toContain("chat")
    } finally {
      server.stop(true)
    }
  })
})
