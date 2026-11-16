# Mobile Web UI Bridge — Plan

## Goal
Add a toggleable **Mobile Web UI** to `packages/kilo-vscode/`. A local Node reverse proxy (`0.0.0.0:4098`) exposes a single-file mobile HTML app that talks to the already-running `kilo serve` backend, so a phone on the same LAN/VPN can drive the agent (chat, stream, approve permissions, view diffs).

## Resolved decisions
- **Auth**: random per-start token. URL is `http://<host>:4098/?t=<token>`. Bridge 401s any request (incl. `/api/*`) missing a matching `?t=`.
- **Toggle scope**: button in **every** `TaskHeader` (sidebar, tabs, Agent Manager). One **shared singleton** server (port 4098 can only host one). State change is **broadcast to all live webviews** so every header agrees.
- **Directory**: always the **sidebar provider's** `getProjectDirectory(currentSession?.id)`. The sidebar provider registers itself as the directory source.
- **Icon**: `server` (exists in upstream registry `packages/ui/src/components/icon.tsx:93`).
- **i18n**: new keys added to `packages/kilo-i18n/src/en.ts` (source of truth; other languages fall back).

## Architecture / data flow
```
Phone browser ──http──> MobileBridgeServer (0.0.0.0:4098, Node http)
                          │  checks ?t=<token>
                          │  GET /            -> serves single-file HTML
                          │  GET/POST /api/*  -> strips /api, appends ?directory=,
                          │                      injects Authorization: Basic kilo:<password>,
                          │                      pipes to backend (SSE streamed, not buffered)
                          └──> kilo serve (baseUrl from connectionService.getServerConfig())
```
- `baseUrl` + `password` come from `connectionService.getServerConfig()` (returns `{ baseUrl, password } | null`).
- Backend reads `directory` from the query string (`packages/opencode/src/server/routes/instance/httpapi/middleware/workspace-routing.ts:95`), so appending `?directory=` is valid.
- The bridge is a **lazy singleton**: started on first toggle-on, stopped on toggle-off, dies with the extension host (no persistence).

## Mobile app endpoints (all same-origin, `?t=` appended)
- `GET /api/workspace` → `{ directory }` (initial)
- `GET /api/session` → sessions array (dropdown)
- `GET /api/session/:id/message` → messages (chat)
- `POST /api/session/:id/prompt_async` → send prompt
- `POST /api/session/:id/abort` → stop
- `GET /api/session/:id/diff?full=true` → Files tab
- `GET /api/permission` → pending permissions
- `POST /api/permission/:id/reply` → approve/reject
- `GET /api/event` → SSE (`message.part.updated`, `session.updated`, `permission.updated`)

## Task list

### 1. New file `packages/kilo-vscode/src/mobile-server.ts`
Export a `MobileBridgeServer` class and a shared singleton `mobileBridge`.

Class API:
- `setConfigSource(fn: () => { baseUrl: string; password: string } | null)`
- `setDirectorySource(fn: () => string | undefined)`
- `subscribe(fn: (state: MobileServerState) => void): () => void` (returns unsubscribe)
- `toggle(): Promise<void>` — idempotent start/stop
- `stop(): void`
- `get state(): MobileServerState` where `MobileServerState = { running: boolean; token?: string; urls: string[]; error?: string }`

Behavior:
- `start()`: `token = crypto.randomBytes(16).toString("hex")`; `http.createServer` bound to `0.0.0.0:4098`. On `listen` `error` (e.g. `EADDRINUSE`) → set `state.error`, `running: false`, notify subscribers.
- `urls`: from `os.networkInterfaces()`, non-internal IPv4 → `http://<ip>:4098/?t=<token>` (plus a `127.0.0.1` entry).
- Request handler:
  - Parse URL. Only allow `GET /` and `/api/*`; else 404.
  - Verify `?t=` equals `token`; else 401.
  - `GET /` → 200 `text/html`, body = `getHtml()`.
  - `/api/*` → proxy:
    - `cfg = configSource()`; if null → 503 JSON `{ error: "backend not connected" }`.
    - `path = url.pathname.replace(/^\/api/, "")`.
    - Merge query: copy existing params, set `directory = directorySource()` (omit if undefined).
    - Headers: copy request headers, **strip hop-by-hop** (`connection, keep-alive, proxy-*, te, trailer, transfer-encoding, upgrade, host, accept-encoding`) — mirror `packages/opencode/src/server/proxy-util.ts`.
    - Set `Authorization: Basic base64("kilo:" + cfg.password)`.
    - Pipe `req` → upstream `res`; pipe upstream `res` → client `res` **without buffering** (SSE). Forward status + headers.
- `getHtml()`: return the single-file mobile app (see Task 2).

### 2. Mobile app HTML (inside `mobile-server.ts` as a template string)
Dark-mode, mobile-first, single file (inline CSS + JS). Plain browser page — uses `fetch`/`EventSource` directly (no `acquireVsCodeApi`).

- Read token from `location.search` (`?t=`); store in a JS var; append `?t=` to every `fetch`/`EventSource` URL. Do **not** persist to localStorage.
- **Top bar**: session `<select>` (from `GET /api/session`) + sticky telemetry bar (input/output/reasoning/cache tokens + cost, from `session.updated` / message parts).
- **Tab 1 — Chat**:
  - Message list rendered from `GET /api/session/:id/message`, updated live via SSE `message.part.updated`.
  - Reasoning parts in collapsible `<details>`.
  - Tool parts as status badges.
  - When a pending permission for the current session exists (`GET /api/permission` / SSE `permission.updated`): inline banner with **Approve Once / Always / Reject** → `POST /api/permission/:id/reply`.
  - Bottom prompt input + **Send** (`POST /api/session/:id/prompt_async`) and **Stop** (`POST /api/session/:id/abort`).
- **Tab 2 — Files**: modified files + unified diff viewer from `GET /api/session/:id/diff?full=true`; refresh on relevant SSE events.
- SSE: `new EventSource("/api/event?t=" + token)`; on reconnect, re-fetch current session messages to catch up.

### 3. `packages/kilo-vscode/src/kilo-provider/options.ts`
Add to `KiloProviderOptions`:
```ts
/** This provider is the sidebar; it supplies the mobile bridge's target directory. */
mobileDirectorySource?: boolean
```

### 4. `packages/kilo-vscode/src/extension.ts`
- Sidebar provider (line ~187): add `mobileDirectorySource: true` to its opts.
- `deactivate()`: call `mobileBridge.stop()` (import the singleton).

### 5. `packages/kilo-vscode/src/KiloProvider.ts`
- Import `mobileBridge` from `./mobile-server`.
- Constructor:
  - `mobileBridge.setConfigSource(() => this.connectionService.getServerConfig())` (idempotent across providers).
  - `if (this.opts.mobileDirectorySource) mobileBridge.setDirectorySource(() => this.getProjectDirectory(this.currentSession?.id))`.
  - `this.unsubscribeMobile = mobileBridge.subscribe((s) => this.postMessage({ type: "mobileServerState", ...s }))`.
- `dispose()`: call `this.unsubscribeMobile?.()`.
- Message handler (near `case "toggleRemote"` at line 1642):
  - `case "toggleMobileServer": await mobileBridge.toggle(); break` (subscribe pushes state to all webviews).
  - `case "requestMobileServerState": this.postMessage({ type: "mobileServerState", ...mobileBridge.state }); break` (webview refresh).

### 6. Message types
- `webview-ui/src/types/messages/webview-messages.ts`:
  - `ToggleMobileServerMessage { type: "toggleMobileServer" }`
  - `RequestMobileServerStateMessage { type: "requestMobileServerState" }`
  - Add both to the `WebviewMessage` union.
- `webview-ui/src/types/messages/extension-messages.ts`:
  - `MobileServerStateMessage { type: "mobileServerState"; running: boolean; token?: string; urls: string[]; error?: string }`
  - Add to the `ExtensionMessage` union.

### 7. Webview context `webview-ui/src/context/mobile-server.ts` (new)
- `useMobileServer()` exposing `{ running, urls, error, toggle }`.
- Subscribe to `mobileServerState` **outside** `onMount` (catch early pushes); send `requestMobileServerState` on mount.
- `toggle()` posts `{ type: "toggleMobileServer" }`.

### 8. `webview-ui/src/components/chat/TaskHeader.tsx`
- In the `task-header-stats` div (line 235), add an `IconButton`:
  - `icon="server"`, `size="small"`, `variant="ghost"`.
  - `data-active={running ? "" : undefined}`, `aria-pressed={running}`.
  - `onClick={() => mobileServer.toggle()}`.
  - `Tooltip`: when running → join `urls` (multi-line) + a copy hint; when off → `language.t("mobileServer.start")`; on error → `language.t("mobileServer.error")`.

### 9. i18n `packages/kilo-i18n/src/en.ts`
Add keys, e.g.:
- `"mobileServer.start": "Open mobile server"`
- `"mobileServer.stop": "Close mobile server"`
- `"mobileServer.url": "Open this URL on your phone (same network)"`
- `"mobileServer.error": "Mobile server failed to start"`

## Failure modes
- **Port 4098 in use** → `listen` error → `state.error` set, `running: false`; tooltip shows error; no crash.
- **Backend not connected** (`getServerConfig()` null) → proxy returns 503; mobile app shows "backend not connected".
- **No directory** (sidebar has no session) → proxy omits `?directory=`; backend falls back to `process.cwd()` (degraded but functional).
- **SSE drop** → `EventSource` auto-reconnects; app re-fetches current session on reconnect.
- **Multiple headers toggle** → singleton `toggle()` is idempotent; broadcast keeps all headers in sync.
- **Extension host restart** → in-memory server dies; state is off until re-toggled (expected).

## Validation
- From `packages/kilo-vscode/`: `bun run typecheck`, `bun run lint`, `bun run test:unit`.
- Run `bun run format` before committing (repo convention).
- Manual E2E: `bun run extension:isolated` → toggle the server button in the sidebar header → open the shown `http://<lan-ip>:4098/?t=...` in a phone browser on the same network → verify: session list, live streaming, reasoning collapse, permission Approve/Reject, prompt send/stop, Files diff tab.
- Confirm a request without `?t=` gets 401; a request with a wrong token gets 401.

## Out of scope
- No token persistence / reconnection across extension restarts.
- No TLS (plain HTTP on the trusted LAN/VPN).
- No per-device session isolation (single shared token per start).
- No i18n translations beyond `en.ts` (other languages fall back to English).
