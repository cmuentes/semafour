# Dedicated Output Channel

**Priority:** P2

Agent Manager has its own output channel. No general "Semafour" output channel exists.

## Remaining Work

- Create `vscode.window.createOutputChannel("Semafour")` during activation
- Centralized logging utility with log levels (debug, info, warn, error)
- Route all `[Semafour New]` log messages to this channel
- Dispose on deactivation
- Migrate existing `console.log("[Semafour New] ...")` calls to the logger
