import * as crypto from "crypto"
import * as http from "http"
import * as os from "os"
import { getMobileHtml } from "./mobile-app"

export type MobileServerState = {
  running: boolean
  token?: string
  urls: string[]
  error?: string
}

const PORT = 4098

// Hop-by-hop + encoding headers must not be forwarded to the backend; mirrors
// packages/opencode/src/server/proxy-util.ts so SSE streams through cleanly.
const HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "accept-encoding",
])

/**
 * Local reverse proxy that exposes the single-file mobile web app on the LAN so
 * a phone on the same network can drive the already-running `kilo serve`
 * backend. A random per-start token gates every request; `/api/*` is proxied to
 * the backend with a `directory` query param and basic auth injected.
 */
export class MobileBridgeServer {
  private server: http.Server | null = null
  private starting: Promise<void> | null = null
  private configSource: (() => { baseUrl: string; password: string } | null) | null = null
  private directorySource: (() => string | undefined) | null = null
  private sessionSource: (() => string | undefined) | null = null
  private listeners = new Set<(state: MobileServerState) => void>()
  private current: MobileServerState = { running: false, urls: [] }

  setConfigSource(fn: () => { baseUrl: string; password: string } | null): void {
    this.configSource = fn
  }

  setDirectorySource(fn: () => string | undefined): void {
    this.directorySource = fn
  }

  setSessionSource(fn: () => string | undefined): void {
    this.sessionSource = fn
  }

  subscribe(fn: (state: MobileServerState) => void): () => void {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  get state(): MobileServerState {
    return this.current
  }

  toggle(): Promise<void> {
    if (this.server) {
      this.stop()
      return Promise.resolve()
    }
    if (this.starting) return this.starting
    this.starting = this.start().finally(() => {
      this.starting = null
    })
    return this.starting
  }

  stop(): void {
    const server = this.server
    this.server = null
    this.emit({ running: false, urls: [] })
    if (!server) return
    server.closeAllConnections?.()
    server.close()
  }

  /**
   * Re-broadcast the current URL while running so it tracks the sidebar's
   * active session. Called when that session changes; the token is unchanged.
   */
  refresh(): void {
    if (!this.server || !this.current.token) return
    this.emit({ ...this.current, urls: this.urls(this.current.token) })
  }

  private start(): Promise<void> {
    const { promise, resolve } = Promise.withResolvers<void>()
    const token = crypto.randomBytes(16).toString("hex")
    const server = http.createServer((req, res) => this.handle(req, res, token))
    server.once("error", (err) => {
      this.server = null
      this.emit({ running: false, urls: [], error: String(err.message ?? err) })
      resolve()
    })
    server.listen(PORT, "0.0.0.0", () => {
      this.server = server
      this.emit({ running: true, token, urls: this.urls(token) })
      resolve()
    })
    return promise
  }

  private urls(token: string): string[] {
    const sid = this.sessionSource?.()
    const query = sid ? `?t=${token}&s=${sid}` : `?t=${token}`
    const out: string[] = []
    const ifaces = os.networkInterfaces()
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name] ?? []) {
        if (iface.family !== "IPv4" || iface.internal) continue
        out.push(`http://${iface.address}:${PORT}/${query}`)
      }
    }
    return out
  }

  private emit(next: MobileServerState): void {
    this.current = next
    for (const fn of this.listeners) fn(next)
  }

  private handle(req: http.IncomingMessage, res: http.ServerResponse, token: string): void {
    const url = new URL(req.url ?? "/", "http://localhost")
    if (url.searchParams.get("t") !== token) {
      res.writeHead(401, { "content-type": "application/json" })
      res.end(JSON.stringify({ error: "unauthorized" }))
      return
    }
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" })
      res.end(getMobileHtml())
      return
    }
    if (url.pathname.startsWith("/api/")) {
      this.proxy(req, res, url)
      return
    }
    res.writeHead(404, { "content-type": "application/json" })
    res.end(JSON.stringify({ error: "not found" }))
  }

  private proxy(req: http.IncomingMessage, res: http.ServerResponse, url: URL): void {
    const cfg = this.configSource?.()
    if (!cfg) {
      res.writeHead(503, { "content-type": "application/json" })
      res.end(JSON.stringify({ error: "backend not connected" }))
      return
    }
    const path = url.pathname.replace(/^\/api/, "") || "/"
    const params = new URLSearchParams(url.search)
    params.delete("t")
    const dir = this.directorySource?.()
    if (dir) params.set("directory", dir)
    const query = params.toString()
    const target = new URL(path + (query ? `?${query}` : ""), cfg.baseUrl)

    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(req.headers)) {
      if (value == null) continue
      const k = key.toLowerCase()
      if (HOP.has(k)) continue
      headers[k] = Array.isArray(value) ? value.join(", ") : value
    }
    headers["authorization"] = "Basic " + Buffer.from(`kilo:${cfg.password}`).toString("base64")

    const upstream = http.request(target, { method: req.method, headers }, (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers)
      up.pipe(res)
    })
    upstream.on("error", () => {
      if (!res.headersSent) res.writeHead(502, { "content-type": "application/json" })
      res.end(JSON.stringify({ error: "upstream error" }))
    })
    req.pipe(upstream)
  }
}

export const mobileBridge = new MobileBridgeServer()
