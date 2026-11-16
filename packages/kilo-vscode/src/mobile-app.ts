/**
 * Single-file mobile web app served by the Mobile Bridge Server.
 *
 * A plain browser page (no acquireVsCodeApi) that talks to the `kilo serve`
 * backend through the bridge's `/api/*` proxy. The token is read from
 * `location.search` and appended to every request; it is never persisted.
 *
 * NOTE: the embedded browser JS intentionally avoids backticks and `${}` so it
 * can live inside this template literal without escaping.
 */
export function getMobileHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0d10">
<title>Semafour</title>
<style>
  :root {
    --bg: #0b0d10; --panel: #12151a; --panel2: #171b21; --border: #232a33;
    --text: #e6ebf0; --muted: #8b97a5; --accent: #4f8cff; --ok: #3fb950;
    --warn: #d29922; --err: #f85149; --user: #1b2430; --tool: #1c2027;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    background: var(--bg); color: var(--text);
    font: 15px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex; flex-direction: column; height: 100dvh; overflow: hidden;
    -webkit-text-size-adjust: 100%;
  }
  header {
    display: flex; flex-direction: column; gap: 6px; padding: 10px 12px;
    background: var(--panel); border-bottom: 1px solid var(--border);
    padding-top: calc(10px + env(safe-area-inset-top));
  }
  #session {
    width: 100%; appearance: none; background: var(--panel2); color: var(--text);
    border: 1px solid var(--border); border-radius: 8px; padding: 9px 10px; font-size: 14px;
  }
  #telemetry { display: flex; gap: 12px; flex-wrap: wrap; color: var(--muted); font-size: 11px; }
  #telemetry b { color: var(--text); font-weight: 600; }
  nav { display: flex; background: var(--panel); border-bottom: 1px solid var(--border); }
  nav button {
    flex: 1; padding: 11px; background: none; border: none; color: var(--muted);
    font-size: 14px; font-weight: 600; border-bottom: 2px solid transparent;
  }
  nav button.active { color: var(--text); border-bottom-color: var(--accent); }
  main { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
  section { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
  section[hidden] { display: none; }
  #messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .msg { max-width: 92%; padding: 10px 12px; border-radius: 12px; white-space: pre-wrap; word-wrap: break-word; }
  .msg.user { align-self: flex-end; background: var(--user); }
  .msg.assistant { align-self: flex-start; background: var(--panel2); }
  .msg .who { font-size: 11px; color: var(--muted); margin-bottom: 4px; font-weight: 600; }
  details.reasoning { background: var(--panel2); border: 1px solid var(--border); border-radius: 10px; padding: 8px 10px; margin: 4px 0; }
  details.reasoning summary { color: var(--muted); font-size: 12px; cursor: pointer; }
  details.reasoning .body { margin-top: 6px; color: var(--muted); white-space: pre-wrap; font-size: 13px; }
  .tool { display: inline-flex; align-items: center; gap: 6px; background: var(--tool); border: 1px solid var(--border); border-radius: 8px; padding: 5px 9px; margin: 3px 0; font-size: 12px; }
  .tool .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); }
  .tool.running .dot { background: var(--warn); }
  .tool.completed .dot { background: var(--ok); }
  .tool.error .dot { background: var(--err); }
  #permission { margin: 0 12px 8px; background: var(--panel2); border: 1px solid var(--warn); border-radius: 10px; padding: 10px; font-size: 13px; }
  #permission[hidden] { display: none; }
  #permission .actions { display: flex; gap: 8px; margin-top: 8px; }
  #permission button { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--panel); color: var(--text); font-size: 13px; }
  #permission button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  #permission button.danger { color: var(--err); }
  #composer { display: flex; gap: 8px; padding: 10px 12px; background: var(--panel); border-top: 1px solid var(--border); padding-bottom: calc(10px + env(safe-area-inset-bottom)); }
  #prompt {
    flex: 1; resize: none; max-height: 120px; background: var(--panel2); color: var(--text);
    border: 1px solid var(--border); border-radius: 10px; padding: 10px; font-size: 15px; font-family: inherit;
  }
  #composer .btns { display: flex; flex-direction: column; gap: 6px; }
  #composer button { padding: 8px 14px; border-radius: 10px; border: none; font-size: 14px; font-weight: 600; }
  #send { background: var(--accent); color: #fff; }
  #send:disabled { opacity: 0.5; }
  #stop { background: var(--panel2); color: var(--err); border: 1px solid var(--border); }
  #diff { padding: 12px; font-size: 12px; }
  .file { background: var(--panel2); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 10px; overflow: hidden; }
  .file .name { padding: 8px 10px; font-weight: 600; background: var(--panel); border-bottom: 1px solid var(--border); }
  .file pre { margin: 0; padding: 8px 10px; overflow-x: auto; white-space: pre; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }
  .file .add { color: var(--ok); }
  .file .del { color: var(--err); }
  .empty { color: var(--muted); text-align: center; padding: 40px 20px; font-size: 13px; }
  .banner { padding: 10px 12px; color: var(--muted); font-size: 13px; text-align: center; }
</style>
</head>
<body>
  <header>
    <select id="session" aria-label="Session"></select>
    <div id="telemetry"></div>
  </header>
  <nav>
    <button data-tab="chat" class="active">Chat</button>
    <button data-tab="files">Files</button>
  </nav>
  <main>
    <section id="chat">
      <div id="messages"></div>
      <div id="permission" hidden></div>
      <div id="composer">
        <textarea id="prompt" rows="1" placeholder="Message Semafour..."></textarea>
        <div class="btns">
          <button id="send">Send</button>
          <button id="stop">Stop</button>
        </div>
      </div>
    </section>
    <section id="files" hidden>
      <div id="diff"><div class="empty">Select a session to view changed files.</div></div>
    </section>
  </main>
  <script>
  (function () {
    "use strict";
    var token = new URLSearchParams(location.search).get("t") || "";
    var sessions = [];
    var current = null;
    var messages = [];
    var permissions = [];
    var busy = false;
    var telemetry = null;

    function $(id) { return document.getElementById(id); }
    function esc(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function api(path, method, body) {
      var url = "/api" + path;
      var sep = url.indexOf("?") === -1 ? "?" : "&";
      url = url + sep + "t=" + encodeURIComponent(token);
      var opts = { method: method || "GET", headers: {} };
      if (body !== undefined) {
        opts.headers["content-type"] = "application/json";
        opts.body = JSON.stringify(body);
      }
      return fetch(url, opts).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
    }

    function loadSessions() {
      return api("/session").then(function (data) {
        sessions = Array.isArray(data) ? data : (data.data || []);
        renderSessions();
        if (!current && sessions.length) selectSession(sessions[0].id);
        else if (current) renderSessions();
      }).catch(function () {
        $("messages").innerHTML = '<div class="banner">Could not load sessions.</div>';
      });
    }

    function renderSessions() {
      var sel = $("session");
      sel.innerHTML = "";
      for (var i = 0; i < sessions.length; i++) {
        var s = sessions[i];
        var opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.title || s.id;
        if (s.id === current) opt.selected = true;
        sel.appendChild(opt);
      }
    }

    function selectSession(id) {
      current = id;
      $("session").value = id;
      messages = [];
      renderMessages();
      loadMessages(id);
      loadPermissions();
      loadDiff(id);
    }

    function loadMessages(id) {
      return api("/session/" + id + "/message").then(function (data) {
        messages = Array.isArray(data) ? data : (data.data || []);
        renderMessages();
      }).catch(function () {});
    }

    function loadPermissions() {
      return api("/permission").then(function (data) {
        permissions = (Array.isArray(data) ? data : (data.data || [])).filter(function (p) {
          return p.sessionID === current;
        });
        renderPermission();
      }).catch(function () {});
    }

    function loadDiff(id) {
      return api("/session/" + id + "/diff?full=true").then(function (data) {
        renderDiff(Array.isArray(data) ? data : (data.data || []));
      }).catch(function () {
        $("diff").innerHTML = '<div class="empty">No changes.</div>';
      });
    }

    function renderTelemetry() {
      var el = $("telemetry");
      if (!telemetry) { el.innerHTML = ""; return; }
      var parts = [];
      if (telemetry.input != null) parts.push('<span>in <b>' + telemetry.input + '</b></span>');
      if (telemetry.output != null) parts.push('<span>out <b>' + telemetry.output + '</b></span>');
      if (telemetry.reasoning != null) parts.push('<span>reason <b>' + telemetry.reasoning + '</b></span>');
      if (telemetry.cache != null) parts.push('<span>cache <b>' + telemetry.cache + '</b></span>');
      if (telemetry.cost != null) parts.push('<span>cost <b>$' + Number(telemetry.cost).toFixed(4) + '</b></span>');
      el.innerHTML = parts.join("");
    }

    function toolState(p) {
      var st = p.state && p.state.status;
      return st || "pending";
    }

    function renderPart(p) {
      if (p.type === "text") {
        if (p.synthetic) return "";
        return '<div class="msg ' + (p.messageRole === "user" ? "user" : "assistant") + '">' +
          (p.messageRole === "user" ? '<div class="who">You</div>' : "") + esc(p.text) + "</div>";
      }
      if (p.type === "reasoning") {
        return '<details class="reasoning"><summary>Reasoning</summary><div class="body">' + esc(p.text) + "</div></details>";
      }
      if (p.type === "tool") {
        var st = toolState(p);
        return '<div class="tool ' + esc(st) + '"><span class="dot"></span>' + esc(p.tool || "tool") + " &middot; " + esc(st) + "</div>";
      }
      return "";
    }

    function renderMessages() {
      var el = $("messages");
      if (!messages.length) {
        el.innerHTML = '<div class="empty">No messages yet. Send one below.</div>';
        return;
      }
      var html = "";
      for (var i = 0; i < messages.length; i++) {
        var m = messages[i];
        var role = m.info && m.info.role;
        var parts = m.parts || [];
        var block = "";
        for (var j = 0; j < parts.length; j++) {
          var part = parts[j];
          if (part.type === "step-start" || part.type === "step-finish") continue;
          if (part.type === "text") part.messageRole = role;
          block += renderPart(part);
        }
        if (block) html += block;
      }
      el.innerHTML = html || '<div class="empty">No messages yet. Send one below.</div>';
      el.scrollTop = el.scrollHeight;
    }

    function renderPermission() {
      var el = $("permission");
      var p = permissions[0];
      if (!p) { el.hidden = true; el.innerHTML = ""; return; }
      el.hidden = false;
      var title = (p.permission || "permission") + (p.pattern ? " (" + p.pattern + ")" : "");
      el.innerHTML =
        '<div>Approve <b>' + esc(title) + "</b>?</div>" +
        '<div class="actions">' +
        '<button class="primary" data-act="once">Approve Once</button>' +
        '<button data-act="always">Always</button>' +
        '<button class="danger" data-act="reject">Reject</button>' +
        "</div>";
    }

    function replyPermission(act) {
      var p = permissions[0];
      if (!p) return;
      var reply = act === "reject" ? "reject" : act === "always" ? "always" : "once";
      api("/permission/" + p.id + "/reply", "POST", { reply: reply }).then(function () {
        return loadPermissions();
      }).catch(function () {});
    }

    function renderDiff(files) {
      var el = $("diff");
      if (!files.length) { el.innerHTML = '<div class="empty">No changes.</div>'; return; }
      var html = "";
      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var patch = f.patch || f.diff || "";
        var lines = String(patch).split("\\n");
        var body = "";
        for (var j = 0; j < lines.length; j++) {
          var ln = lines[j];
          var cls = ln.charAt(0) === "+" ? "add" : ln.charAt(0) === "-" ? "del" : "";
          body += '<div class="' + cls + '">' + esc(ln) + "</div>";
        }
        html += '<div class="file"><div class="name">' + esc(f.file || f.path || "file") + "</div><pre>" + body + "</pre></div>";
      }
      el.innerHTML = html;
    }

    function setBusy(b) {
      busy = b;
      $("send").disabled = b;
    }

    function send() {
      var text = $("prompt").value.trim();
      if (!text || !current) return;
      $("prompt").value = "";
      api("/session/" + current + "/prompt_async", "POST", { parts: [{ type: "text", text: text }] })
        .then(function () { setBusy(true); })
        .catch(function () {});
    }

    function stop() {
      if (!current) return;
      api("/session/" + current + "/abort", "POST", {}).then(function () { setBusy(false); }).catch(function () {});
    }

    function onEvent(e) {
      var ev;
      try { ev = JSON.parse(e.data); } catch (err) { return; }
      var type = ev.type;
      var props = ev.properties || {};
      if (type === "session.status" && props.sessionID === current) {
        setBusy(props.status && props.status.type === "busy");
      }
      if (type === "message.part.updated" && props.part && props.part.sessionID === current) {
        loadMessages(current);
      }
      if (type === "session.updated" && props.session && props.session.id === current) {
        telemetry = props.session;
        renderTelemetry();
        renderSessions();
      }
      if (type === "permission.updated") {
        loadPermissions();
      }
    }

    function connectSSE() {
      var src = new EventSource("/api/event?t=" + encodeURIComponent(token));
      src.onmessage = onEvent;
      src.onerror = function () {
        src.close();
        if (current) loadMessages(current);
        setTimeout(connectSSE, 2000);
      };
    }

    function switchTab(tab) {
      var chat = $("chat");
      var files = $("files");
      var buttons = document.querySelectorAll("nav button");
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.toggle("active", buttons[i].getAttribute("data-tab") === tab);
      }
      chat.hidden = tab !== "chat";
      files.hidden = tab !== "files";
      if (tab === "files" && current) loadDiff(current);
    }

    $("session").addEventListener("change", function (e) { selectSession(e.target.value); });
    $("send").addEventListener("click", send);
    $("stop").addEventListener("click", stop);
    $("prompt").addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    });
    $("permission").addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("button[data-act]") : null;
      if (btn) replyPermission(btn.getAttribute("data-act"));
    });
    var navButtons = document.querySelectorAll("nav button");
    for (var n = 0; n < navButtons.length; n++) {
      navButtons[n].addEventListener("click", function (e) { switchTab(e.target.getAttribute("data-tab")); });
    }

    loadSessions();
    connectSSE();
  })();
  </script>
</body>
</html>`
}
