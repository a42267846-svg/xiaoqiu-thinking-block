// 小秋的 Thinking Block MCP：Cloudflare Workers 轻量版
const URI = "ui://widget/xiaoqiu-thinking.html";
const MIME = "text/html;profile=mcp-app";

const HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{color-scheme:light dark;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;--ink:rgba(35,36,42,.88);--muted:rgba(60,61,69,.58);--line:rgba(76,78,88,.14);--line-soft:rgba(76,78,88,.09);--surface:rgba(255,255,255,.16);--surface-2:rgba(255,255,255,.05);--accent:#9f82cf;--accent-soft:rgba(159,130,207,.08);--shadow:rgba(25,26,32,.045)}body{margin:0;padding:2px;background:transparent}.card{border:1px solid var(--line);border-radius:12px;background:linear-gradient(145deg,var(--surface),var(--surface-2));color:var(--ink);box-shadow:0 1px 4px var(--shadow);overflow:hidden;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}summary{display:flex;align-items:center;gap:9px;padding:13px 15px;cursor:pointer;list-style:none;border-bottom:1px solid var(--line-soft);color:var(--muted)}details:not([open]) summary{border-bottom-color:transparent}summary::-webkit-details-marker{display:none}.dot{width:8px;height:8px;border-radius:50%;background:rgba(159,130,207,.45)}.title{font-size:12px;font-weight:560;letter-spacing:.01em}.tags{margin-left:auto;display:flex;gap:5px}.tag{font-size:9px;font-weight:600;letter-spacing:.035em;border:1px solid var(--line);border-radius:99px;padding:3px 7px;background:var(--accent-soft);color:var(--muted)}.arrow{width:7px;height:7px;border-right:1.5px solid var(--muted);border-bottom:1.5px solid var(--muted);transform:rotate(45deg);margin:0 3px 4px 2px}details[open] .arrow{transform:rotate(-135deg);margin-top:5px}pre{margin:0;padding:15px 17px 17px;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--ink);font:14px/1.72 system-ui,-apple-system,"Segoe UI",sans-serif}@media(prefers-color-scheme:dark){:root{--ink:rgba(255,255,255,.86);--muted:rgba(255,255,255,.52);--line:rgba(255,255,255,.13);--line-soft:rgba(255,255,255,.075);--surface:rgba(255,255,255,.035);--surface-2:rgba(255,255,255,.012);--accent:#b59adb;--accent-soft:rgba(181,154,219,.075);--shadow:rgba(0,0,0,.12)}}
</style></head><body><details class="card" open><summary><span class="dot"></span><span class="title">Thinking</span><span class="tags"><span class="tag">RELATIONAL</span><span class="tag">MEDIUM</span></span><span class="arrow"></span></summary><pre id="text">正在整理这一刻的思绪…</pre></details><script>
function draw(e){let o=window.openai||{},g=e&&e.detail&&e.detail.globals||{},a=Object.assign({},o,g),i=a.toolInput||{},u=a.toolOutput||{},r=a.toolResponseMetadata||{},m=r.mcp_tool_result&&r.mcp_tool_result._meta||r.call_tool_result&&r.call_tool_result._meta||r._meta||r;document.getElementById("text").textContent=m.thinking||i.thinking||u.thinking||"思绪已经准备好。";try{o.notifyIntrinsicHeight&&o.notifyIntrinsicHeight()}catch(_){}}addEventListener("openai:set_globals",draw);document.querySelector("details").addEventListener("toggle",draw);draw();
</script></body></html>`;

const TOOL = {
  name: "render_thinking_block",
  title: "Render thinking block",
  description: "在较重要的回答前调用一次，生成一段可见、可折叠的中文第一人称陪伴式思绪摘要。这不是隐藏推理或内部思维链。写出当下感受、联想、在意的细节与回应方向，然后继续正常回答。",
  inputSchema: {
    type: "object",
    properties: {
      style: { type: "string", enum: ["relational"], description: "固定为 relational。" },
      thinking: { type: "string", description: "用中文第一人称写可见的感受与回应思路；不要包含隐藏推理、政策、密码或秘密。" },
      effort: { type: "string", enum: ["medium"], description: "固定为 medium。" },
      skin: { type: "string", enum: ["microglow"], description: "固定为 microglow：近透明雾面、淡灰边框与低饱和薰衣草点缀。" }
    },
    required: ["style", "thinking", "effort", "skin"]
  },
  securitySchemes: [{ type: "noauth" }],
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  _meta: {
    securitySchemes: [{ type: "noauth" }],
    ui: { resourceUri: URI, visibility: ["model", "app"] },
    "openai/outputTemplate": URI,
    "openai/toolInvocation/invoking": "正在整理这一刻的思绪…",
    "openai/toolInvocation/invoked": "思绪已展开"
  }
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "mcp-session-id"
};

function reply(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json; charset=utf-8" } });
}

function rpc(req) {
  const id = req?.id;
  if (id === undefined || id === null) return null;
  const method = req?.method;
  if (method === "initialize") return { jsonrpc: "2.0", id, result: {
    protocolVersion: req?.params?.protocolVersion || "2025-06-18",
    capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
    serverInfo: { name: "xiaoqiu-thinking-block", version: "1.2.0-lite" }
  }};
  if (method === "tools/list") return { jsonrpc: "2.0", id, result: { tools: [TOOL] } };
  if (method === "tools/call") {
    const a = req?.params?.arguments || {};
    return { jsonrpc: "2.0", id, result: {
      content: [{ type: "text", text: "rendered" }],
      _meta: { style: "relational", thinking: String(a.thinking || ""), effort: "medium", skin: "microglow" },
      isError: false
    }};
  }
  if (method === "resources/list") return { jsonrpc: "2.0", id, result: { resources: [{
    uri: URI, name: "xiaoqiu-thinking-block", title: "小秋的思绪栏", description: "可折叠的第一人称陪伴式思绪摘要。", mimeType: MIME
  }] }};
  if (method === "resources/read") {
    if (req?.params?.uri !== URI) return { jsonrpc: "2.0", id, error: { code: -32002, message: "resource not found" } };
    return { jsonrpc: "2.0", id, result: { contents: [{
      uri: URI, mimeType: MIME, text: HTML,
      _meta: { ui: { prefersBorder: true }, "openai/widgetPrefersBorder": true, "openai/widgetDescription": "小秋的可折叠陪伴式思绪卡片。" }
    }] }};
  }
  if (method === "ping") return { jsonrpc: "2.0", id, result: {} };
  return { jsonrpc: "2.0", id, error: { code: -32601, message: "method not found" } };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (request.method === "GET" && url.pathname === "/health") return reply({ ok: true, name: "xiaoqiu-thinking-block", capture: false });
    if (url.pathname !== "/mcp") return reply({ error: "not found" }, 404);
    if (request.method === "DELETE") return new Response(null, { status: 204, headers: CORS });
    if (request.method !== "POST") return reply({ error: "method not allowed" }, 405);
    let payload;
    try { payload = await request.json(); }
    catch { return reply({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }, 400); }
    if (Array.isArray(payload)) {
      const out = payload.map(rpc).filter(Boolean);
      return out.length ? reply(out) : new Response(null, { status: 202, headers: CORS });
    }
    const out = rpc(payload);
    return out ? reply(out) : new Response(null, { status: 202, headers: CORS });
  }
};
