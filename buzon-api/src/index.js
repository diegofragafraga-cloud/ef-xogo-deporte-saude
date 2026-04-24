// Worker buzón · recibe entregas POST e expón descarga privada.
// A clave admin vive como secret: `npx wrangler secret put ADMIN_KEY`

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const adminKey = env.ADMIN_KEY;
    if (!adminKey) {
      return new Response("Worker sen ADMIN_KEY configurada. Execute: npx wrangler secret put ADMIN_KEY", { status: 500 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // Recepción de entregas do alumnado
    if (path === "/enviar" && request.method === "POST") {
      try {
        const body = await request.text();
        const data = JSON.parse(body);
        const ts = Date.now();
        const rand = Math.random().toString(36).slice(2, 8);
        const id = `entrega:${ts}:${rand}`;
        const htmlId = `html:${ts}:${rand}`;
        const record = {
          data_recepcion: new Date().toISOString(),
          nome: String(data.nome || "").slice(0, 200),
          curso: String(data.curso || "").slice(0, 80),
          ficha: String(data.ficha || "").slice(0, 200),
          nota: data.nota != null ? Number(data.nota) : null,
          correctas: data.correctas != null ? Number(data.correctas) : null,
          total: data.total != null ? Number(data.total) : null,
          detalle: String(data.detalle || "").slice(0, 10000),
          user_agent: String((request.headers.get("user-agent") || "")).slice(0, 200),
          has_html: !!data.html_snapshot
        };
        await env.ENTREGAS.put(id, JSON.stringify(record));
        if (data.html_snapshot) {
          await env.ENTREGAS.put(htmlId, String(data.html_snapshot).slice(0, 500_000));
        }
        return json({ ok: true, id });
      } catch (err) {
        return json({ ok: false, error: String(err) }, 400);
      }
    }

    // Descarga (CSV ou JSON) protexida por password
    if (path === "/descargar" && request.method === "GET") {
      const key = url.searchParams.get("key");
      if (key !== adminKey) return new Response("Non autorizado", { status: 401 });

      const format = url.searchParams.get("format") || "csv";
      const limpar = url.searchParams.get("limpar") === "1";

      const entregas = await listarTodo(env);

      if (limpar) {
        for (const e of entregas) await env.ENTREGAS.delete(e.id);
      }

      const fecha = new Date().toISOString().slice(0, 10);

      if (format === "json") {
        return new Response(JSON.stringify(entregas, null, 2), {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="entregas-${fecha}.json"`
          }
        });
      }

      // CSV (con BOM para Excel)
      const cabeceira = ["data_recepcion", "nome", "curso", "ficha", "nota", "correctas", "total", "detalle"];
      const rows = [cabeceira.join(",")];
      for (const e of entregas) {
        rows.push(cabeceira.map(h => escapeCsv(e[h])).join(","));
      }
      const csv = "﻿" + rows.join("\n");
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="entregas-${fecha}.csv"`
        }
      });
    }

    // Corrixir unha entrega con IA (Claude)
    if (path === "/corrixir" && request.method === "POST") {
      const keyParam = url.searchParams.get("key");
      if (keyParam !== adminKey) return new Response("Non autorizado", { status: 401 });
      const apiKey = env.ANTHROPIC_API_KEY;
      if (!apiKey) return json({ ok: false, error: "ANTHROPIC_API_KEY non configurada aínda" }, 500);
      let body;
      try { body = await request.json(); } catch (e) { return json({ ok: false, error: "JSON inválido" }, 400); }
      const id = body.id;
      if (!id || !id.startsWith("entrega:")) return json({ ok: false, error: "id inválido" }, 400);
      const record = await env.ENTREGAS.get(id);
      if (!record) return json({ ok: false, error: "entrega non atopada" }, 404);
      const data = JSON.parse(record);

      const prompt = `Es docente experto/a en 5.º de Primaria. Avalía esta entrega dun/ha alumno/a dentro da situación de aprendizaxe "Xogamos na rúa" (xogos tradicionais galegos + uso responsable das pantallas).

FICHA: ${data.ficha}
ALUMNO/A: ${data.nome} (${data.curso})
NOTA AUTOMÁTICA PREVIA: ${data.nota != null ? data.nota + "/10 (" + data.correctas + "/" + data.total + ")" : "non aplicable (ficha de entrega libre)"}
RESPOSTAS DO/A ALUMNO/A:
${data.detalle || "(baleiro)"}

Avalía en GALEGO NORMATIVO, con linguaxe clara e construtiva. Ten en conta que é 5.º Primaria (10-11 anos). Responde SÓ un obxecto JSON válido con este formato exacto:
{"nota": N.N, "fortes": "frase breve", "mellorar": "frase breve", "comentario": "frase curta para familias"}

Onde:
- nota: valor decimal 1-10 (considerando que para 5.º é xusto aprobar con 5 e sobresaliente con 9+)
- fortes: que fixo ben (1-2 liñas)
- mellorar: que pode mellorar (1-2 liñas, construtivo)
- comentario: 1 liña síntese`;

      try {
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
            "x-api-key": apiKey
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 600,
            messages: [{ role: "user", content: prompt }]
          })
        });
        if (!r.ok) {
          const errTxt = await r.text();
          return json({ ok: false, error: "Claude API erro " + r.status, detail: errTxt.slice(0, 500) }, 502);
        }
        const claudeResp = await r.json();
        const content = (claudeResp.content && claudeResp.content[0] && claudeResp.content[0].text) || "";
        // Extraer JSON dun texto con posibles delimitadores
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        let evaluacion;
        try {
          evaluacion = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        } catch (e) {
          evaluacion = { raw: content, parse_error: true };
        }

        data.ia_correccion = evaluacion;
        data.ia_corrected_at = new Date().toISOString();
        await env.ENTREGAS.put(id, JSON.stringify(data));
        return json({ ok: true, correccion: evaluacion });
      } catch (err) {
        return json({ ok: false, error: "Excepción: " + String(err) }, 500);
      }
    }

    // Imprimir todas as entregas como un só PDF
    if (path === "/imprimir" && request.method === "GET") {
      const key = url.searchParams.get("key");
      if (key !== adminKey) return new Response("Non autorizado", { status: 401 });

      const filtroFicha = url.searchParams.get("ficha"); // opcional: filtrar por ficha
      const filtroCurso = url.searchParams.get("curso"); // opcional: filtrar por curso
      const entregas = await listarTodo(env);

      const baseUrl = "https://xogamos-na-rua.pages.dev/xogo%20e%20pantallas/MATES_integracion/";
      const partes = [];
      let incluidas = 0;

      for (const e of entregas) {
        if (!e.has_html) continue;
        if (filtroFicha && e.ficha !== filtroFicha) continue;
        if (filtroCurso && e.curso !== filtroCurso) continue;
        const htmlId = e.id.replace(/^entrega:/, "html:");
        const snap = await env.ENTREGAS.get(htmlId);
        if (!snap) continue;
        const m = snap.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (!m) continue;
        partes.push(`<section class="entrega-bloque">${m[1]}</section>`);
        incluidas++;
      }

      if (incluidas === 0) {
        return new Response(
          '<html><body style="font-family:system-ui;padding:40px;text-align:center"><h1>Sen entregas para imprimir</h1><p>Non hai entregas con ficha gardada (só se conservan desde a actualización).</p><p><a href="/panel?key=' + adminKey + '">← Volver ao buzón</a></p></body></html>',
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }

      const doc = `<!DOCTYPE html>
<html lang="gl">
<head>
<meta charset="UTF-8">
<base href="${baseUrl}">
<title>Entregas consolidadas · Imprimir</title>
<link rel="stylesheet" href="proba_engine.css">
<style>
  @page { size: A4; margin: 12mm; }
  html, body { margin:0; padding:0; }
  body { font-family: system-ui,-apple-system,sans-serif; color: #2D2A26; font-size: 10pt; line-height: 1.5; padding-top: 52px; }
  .entrega-bloque { page-break-after: always; padding: 0 16px; max-width: 1100px; margin: 0 auto 24px; }
  .entrega-bloque:last-child { page-break-after: auto; }
  [data-ok] { border:0 !important; border-bottom:1px solid #c8d8e0 !important; background:transparent !important; padding:1px 4px; font:inherit; width:80px; }
  [data-ok].ok { background:#e8f5e8 !important; color:#1e5a1e !important; border-color:#3a8a3a !important; }
  [data-ok].fail { background:#fde8ea !important; color:#7a1b22 !important; border-color:#b8242e !important; }
  .toolbar { position:fixed; top:0; left:0; right:0; background:#1e4650; color:white; padding:10px 16px; z-index:99999; display:flex; gap:10px; align-items:center; font-family:system-ui; font-size:13px; box-shadow:0 2px 10px rgba(0,0,0,.2); }
  .toolbar button { padding:8px 16px; background:#f5b450; color:#1e4650; border:0; border-radius:6px; font:700 13px system-ui; cursor:pointer; }
  .toolbar a { padding:6px 14px; background:transparent; color:white; border:1px solid rgba(255,255,255,.3); border-radius:6px; text-decoration:none; font:600 12px system-ui; }
  @media print {
    .toolbar { display:none !important; }
    body { padding-top:0 !important; }
  }
</style>
</head>
<body>
<div class="toolbar">
  <span>📄 <b>${incluidas}</b> entregas consolidadas</span>
  <button onclick="window.print()" style="margin-left:auto">🖨 Imprimir / Gardar PDF</button>
  <a href="/panel?key=${adminKey}">← Buzón</a>
</div>
${partes.join("\n")}
<script>
  // Auto-dispara o diálogo de impresión tras renderizar
  window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 900); });
</script>
</body>
</html>`;
      return new Response(doc, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // Ver ficha resolta tal como a entregou o alumno
    if (path === "/ver" && request.method === "GET") {
      const key = url.searchParams.get("key");
      if (key !== adminKey) return new Response("Non autorizado", { status: 401 });
      const id = url.searchParams.get("id");
      if (!id || !id.startsWith("entrega:")) return new Response("Falta id válido", { status: 400 });
      const htmlId = id.replace(/^entrega:/, "html:");
      const html = await env.ENTREGAS.get(htmlId);
      if (!html) return new Response("Esta entrega non garda HTML (quizais é dunha versión anterior).", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      // Inxectamos <base> para que CSS/imaxes relativas funcionen + barra de ferramentas
      const baseUrl = "https://xogamos-na-rua.pages.dev/xogo%20e%20pantallas/MATES_integracion/";
      const inject =
        `<base href="${baseUrl}">` +
        `<div style="position:fixed;top:0;left:0;right:0;background:#1e4650;color:white;padding:8px 16px;z-index:99999;font-family:system-ui;font-size:13px;display:flex;gap:10px;align-items:center;box-shadow:0 2px 10px rgba(0,0,0,.2)">` +
        `<span>📄 Ficha resolta</span>` +
        `<button onclick="window.print()" style="margin-left:auto;padding:6px 14px;background:#f5b450;color:#1e4650;border:0;border-radius:6px;font:700 12px system-ui;cursor:pointer">🖨 Imprimir / Gardar PDF</button>` +
        `<a href="/panel?key=${adminKey}" style="padding:6px 14px;background:transparent;color:white;border:1px solid rgba(255,255,255,.3);border-radius:6px;text-decoration:none;font:600 12px system-ui">← Buzón</a>` +
        `</div>` +
        `<style>@media print { body > div[style*="position:fixed"] { display:none !important; } body { padding-top:0 !important; } }</style>` +
        `<style>body { padding-top:44px !important; }</style>`;
      const modified = html.replace(/<head(\s*[^>]*)?>/i, function (m) { return m + inject; });
      return new Response(modified, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // Panel web (HTML simple) protexido con ?key=
    if ((path === "/" || path === "/panel") && request.method === "GET") {
      const key = url.searchParams.get("key");
      if (key !== adminKey) {
        return html(`<h1>📥 Buzón de entregas</h1>
<p>Acceso privado. Engade <code>?key=TÚA_PASSWORD</code> ao URL.</p>`);
      }
      const entregas = await listarTodo(env);
      const filas = entregas.map(e => {
        const nota = e.nota != null ? e.nota : "—";
        const cl = e.nota >= 7 ? "apr" : (e.nota >= 5 ? "med" : (e.nota != null ? "sus" : ""));
        const d = e.data_recepcion ? new Date(e.data_recepcion).toLocaleString("gl-ES") : "";
        const detalle = (e.detalle || "").replace(/</g, "&lt;");
        return `<tr>
          <td>${d}</td>
          <td><b>${escapeHtml(e.nome)}</b></td>
          <td>${escapeHtml(e.curso)}</td>
          <td>${escapeHtml(e.ficha)}</td>
          <td class="nota ${cl}">${nota}</td>
          <td>${e.correctas != null ? e.correctas + "/" + e.total : ""}</td>
          <td class="det">${detalle.slice(0, 300)}${detalle.length > 300 ? "…" : ""}</td>
          <td>${e.has_html ? `<a class="btnmini" href="/ver?id=${encodeURIComponent(e.id)}&key=${adminKey}" target="_blank">📄 Ver</a>` : "—"}</td>
        </tr>`;
      }).join("");

      return html(`
<style>
  :root { --dixi:#2e86ab; --dixi-d:#1e4650; --crem:#faf7f2; --apr:#2e7530; --med:#c98a1a; --sus:#b8242e; --grey:#6b5d48; --light:#e8e2d8; }
  * { box-sizing:border-box }
  body { font-family:system-ui,-apple-system,sans-serif; background:var(--crem); margin:0; padding:24px; color:#2D2A26 }
  .wrap { max-width:1400px; margin:0 auto }
  h1 { color:var(--dixi); font-size:28px }
  .meta { color:var(--grey); font-size:14px; margin:8px 0 20px }
  .botoes { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px }
  .btn { display:inline-flex; align-items:center; gap:6px; padding:10px 16px; background:var(--dixi); color:white; text-decoration:none; border-radius:8px; font-size:13px; font-weight:600; border:0; cursor:pointer; transition:background .15s; }
  .btn:hover { background:var(--dixi-d) }
  .btn.danger { background:var(--sus) }
  .btn.danger:hover { background:#8c1b24 }
  .btn.ghost { background:white; color:var(--dixi-d); border:1.5px solid var(--dixi) }
  table { width:100%; border-collapse:collapse; background:white; box-shadow:0 2px 12px rgba(0,0,0,.05); border-radius:10px; overflow:hidden }
  th { background:var(--dixi); color:white; padding:10px 12px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:1px }
  td { padding:10px 12px; border-bottom:1px solid var(--light); font-size:13px; vertical-align:top }
  tr:nth-child(even) td { background:#fafcfe }
  td.nota { font-weight:700; font-size:15px; text-align:center }
  td.nota.apr { color:var(--apr) }
  td.nota.med { color:var(--med) }
  td.nota.sus { color:var(--sus) }
  td.det { font-size:11px; color:var(--grey); max-width:360px; font-family:ui-monospace,monospace }
  .btnmini { display:inline-block; padding:4px 10px; background:#f5b450; color:#1e4650; text-decoration:none; border-radius:6px; font-size:11px; font-weight:700; border:0; cursor:pointer; font-family:inherit }
  .btnmini:hover { background:#ffc97a }
  .btnmini.ia { background:#8b4a8e; color:white; }
  .btnmini.ia:hover { background:#6a2b6e; }
  .btnmini.ia:disabled { background:#c4a7c6; cursor:wait; }
  .iabox { display:flex; gap:8px; align-items:flex-start; }
  .ianota { background:#8b4a8e; color:white; padding:4px 8px; border-radius:6px; font-weight:800; font-size:11px; white-space:nowrap; }
  .iatxt { font-size:11px; color:#4a3a4a; line-height:1.35; max-width:280px; }
  .iatxt b { color:#6a2b6e; }
  .vacio { text-align:center; padding:60px; color:var(--grey); background:white; border-radius:10px }
</style>
<div class="wrap">
  <h1>📥 Buzón · Entregas de fichas</h1>
  <div class="meta"><b>${entregas.length}</b> entregas totais. Protexido — non compartas este URL.</div>
  <div class="botoes">
    <a class="btn" href="/descargar?key=${adminKey}">📊 Descargar CSV</a>
    <a class="btn" href="/imprimir?key=${adminKey}" target="_blank">📄 Descargar PDF (todas)</a>
    <a class="btn ghost" href="/descargar?key=${adminKey}&format=json">{} Descargar JSON</a>
    <a class="btn danger" href="/descargar?key=${adminKey}&limpar=1" onclick="return confirm('Descargar CSV e BALEIRAR o buzón por completo? Non se pode desfacer.')">🗑 Descargar + baleirar</a>
    <a class="btn ghost" href="/panel?key=${adminKey}">↻ Actualizar</a>
  </div>
  ${entregas.length === 0
    ? '<div class="vacio">Aínda non hai ningunha entrega.</div>'
    : `<table>
        <tr><th>Data</th><th>Alumno</th><th>Curso</th><th>Ficha</th><th>Nota</th><th>Aciertos</th><th>Detalle</th><th>Ficha</th></tr>
        ${filas}
      </table>`}
</div>`);
    }

    return new Response("Buzón fichas · OK", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
};

async function listarTodo(env) {
  const todos = [];
  let cursor;
  do {
    const page = await env.ENTREGAS.list({ prefix: "entrega:", cursor });
    for (const k of page.keys) {
      const v = await env.ENTREGAS.get(k.name);
      if (v) todos.push({ id: k.name, ...JSON.parse(v) });
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  todos.sort((a, b) => b.id.localeCompare(a.id));
  return todos;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS }
  });
}

function html(body) {
  return new Response(`<!DOCTYPE html><html lang="gl"><head><meta charset="utf-8"><title>Buzón · Fichas</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${body}</body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

function escapeCsv(v) {
  if (v == null) return "";
  const s = String(v);
  if (/[,"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function escapeHtml(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}
