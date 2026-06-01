// Worker buzón · recibe entregas POST e expón descarga privada.
// A clave admin vive como secret: `npx wrangler secret put ADMIN_KEY`

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

// Listaxe oficial de 5ºB — extraída de "5º MATES: DOCUMENTO COMPETENCIAL"
const ALUMNOS_5B = [
  { key: "iker",   nome: "Abal Dorado, Iker",        tokens: ["iker", "abal", "dorado"] },
  { key: "adrian", nome: "Búa Pardo, Adrián",        tokens: ["adrian", "bua", "pardo"] },
  { key: "paula",  nome: "Castro Cernadas, Paula",   tokens: ["paula", "castro", "cernadas"] },
  { key: "ingrid", nome: "Costa Castro, Ingrid",     tokens: ["ingrid", "costa", "castro"] },
  { key: "eloa",   nome: "Fernándes Leonor, Eloá",   tokens: ["eloa", "fernandes", "leonor"] },
  { key: "alex",   nome: "Ferro Pita, Alex",         tokens: ["alex", "ferro", "pita"] },
  { key: "xurxo",  nome: "Pazos Sineiro, Xurxo",     tokens: ["xurxo", "pazos", "sineiro"] },
  { key: "anxo",   nome: "Pedreira González, Anxo",  tokens: ["anxo", "pedreira", "gonzalez"] },
  { key: "antia",  nome: "Pereira Fariña, Antía",    tokens: ["antia", "pereira", "farina"] },
  { key: "unai",   nome: "Radío Prieto, Unai",       tokens: ["unai", "radio", "prieto"] },
  { key: "aisha",  nome: "Suárez Khoule, Aisha",     tokens: ["aisha", "suarez", "khoule"] },
  { key: "david",  nome: "Varela Porto, David",      tokens: ["david", "varela", "porto"] },
  { key: "mateo",  nome: "Veiga García, Mateo",      tokens: ["mateo", "veiga", "garcia"] }
];

// 12 fichas interactivas con auto-corrección (data-ok) na SdA Xogamos na rúa 5º
const FICHAS_XOGAMOS = [
  { id: "activacion",   titulo: "Activación proporcional · Tempo de xogo",            curta: "Activación proporcional", sesion: "S2",  grupo: "xogamos" },
  { id: "reto",         titulo: "Reto proporcional · Canto usamos as pantallas?",     curta: "Reto proporcional",       sesion: "S4",  grupo: "xogamos" },
  { id: "porcentaxes",  titulo: "Ficha graduada · Porcentaxes e regra de 3",          curta: "Porcentaxes",             sesion: "S6",  grupo: "xogamos" },
  { id: "calculo",      titulo: "Cálculo xeométrico do material",                     curta: "Cálculo xeométrico",      sesion: "S8",  grupo: "xogamos" },
  { id: "escala",       titulo: "Escala e distancias · Mapa do concello",             curta: "Escala e distancias",     sesion: "S10", grupo: "xogamos" },
  { id: "tempo",        titulo: "Magnitudes · Unidades de tempo",                     curta: "Mat S1 · Tempo",          sesion: "S6",  grupo: "xogamos" },
  { id: "cronometraxe", titulo: "Magnitudes · Cronometraxe con décimas e centésimas", curta: "Mat S2 · Cronometraxe",   sesion: "S11", grupo: "xogamos" },
  { id: "lonxitude",    titulo: "Magnitudes · Lonxitude e lanzamentos",               curta: "Mat S3 · Lonxitude",      sesion: "S9",  grupo: "xogamos" },
  { id: "distancias",   titulo: "Magnitudes · Distancias e orientación polo concello", curta: "Mat S4 · Distancias",   sesion: "S10", grupo: "xogamos" },
  { id: "superficie",   titulo: "Magnitudes · Superficie das zonas de xogo",          curta: "Mat S5 · Superficie",     sesion: "S10", grupo: "xogamos" },
  { id: "peso",         titulo: "Magnitudes · Peso e masa",                            curta: "Mat S6 · Peso e masa",   sesion: "S8",  grupo: "xogamos" },
  { id: "integracion",  titulo: "Integración de magnitudes · Problemas mixtos",        curta: "Mat S7 · Integración",   sesion: "S16", grupo: "xogamos" }
];

// 24 propostas competenciais 5º · 3º trimestre (Lites · Escalas · Polígonos · Estatística)
// Cada actividade ten 3 niveis (N1=Básico, N2=Medio, N3=Avanzado) e 2 actividades por nivel
const FICHAS_PROPOSTAS5 = [
  // Sentido numérico · Lites (economía do recreo)
  { id: "prop-l1-1", titulo: "Propostas 5º · Lites · N1 · A semana da tarxeta",             curta: "A semana da tarxeta",          sesion: "L·N1", grupo: "propostas5" },
  { id: "prop-l1-2", titulo: "Propostas 5º · Lites · N1 · ¿Que podemos coller hoxe?",       curta: "Que podemos coller",           sesion: "L·N1", grupo: "propostas5" },
  { id: "prop-l2-1", titulo: "Propostas 5º · Lites · N2 · ¿Cantos recreos de parchís?",     curta: "Cantos recreos parchis",       sesion: "L·N2", grupo: "propostas5" },
  { id: "prop-l2-2", titulo: "Propostas 5º · Lites · N2 · Cambio de lites a euros",          curta: "Cambio lites euros",           sesion: "L·N2", grupo: "propostas5" },
  { id: "prop-l3-1", titulo: "Propostas 5º · Lites · N3 · Plan da quincena",                 curta: "Plan da quincena",             sesion: "L·N3", grupo: "propostas5" },
  { id: "prop-l3-2", titulo: "Propostas 5º · Lites · N3 · Desconto da Semana das Letras",    curta: "Desconto Semana Letras",       sesion: "L·N3", grupo: "propostas5" },
  // Sentido da medida · Escalas
  { id: "prop-e1-1", titulo: "Propostas 5º · Escalas · N1 · Ler unha escala numérica",      curta: "Ler escala numérica",          sesion: "E·N1", grupo: "propostas5" },
  { id: "prop-e1-2", titulo: "Propostas 5º · Escalas · N1 · Escoller a escala adecuada",    curta: "Escoller escala",              sesion: "E·N1", grupo: "propostas5" },
  { id: "prop-e2-1", titulo: "Propostas 5º · Escalas · N2 · Plano da aula",                 curta: "Plano da aula",                sesion: "E·N2", grupo: "propostas5" },
  { id: "prop-e2-2", titulo: "Propostas 5º · Escalas · N2 · Cambio de escala",              curta: "Cambio de escala",             sesion: "E·N2", grupo: "propostas5" },
  { id: "prop-e3-1", titulo: "Propostas 5º · Escalas · N3 · Plano da túa habitación",       curta: "Plano da habitación",          sesion: "E·N3", grupo: "propostas5" },
  { id: "prop-e3-2", titulo: "Propostas 5º · Escalas · N3 · Excursión en mapa",             curta: "Excursión en mapa",            sesion: "E·N3", grupo: "propostas5" },
  // Sentido espacial · Polígonos
  { id: "prop-p1-1", titulo: "Propostas 5º · Polígonos · N1 · Regular ou irregular",        curta: "Regular ou irregular",         sesion: "P·N1", grupo: "propostas5" },
  { id: "prop-p1-2", titulo: "Propostas 5º · Polígonos · N1 · Nomes segundo o número de lados", curta: "Nomes de polígonos",       sesion: "P·N1", grupo: "propostas5" },
  { id: "prop-p2-1", titulo: "Propostas 5º · Polígonos · N2 · Perímetro dun hexágono regular", curta: "Perímetro hexágono",        sesion: "P·N2", grupo: "propostas5" },
  { id: "prop-p2-2", titulo: "Propostas 5º · Polígonos · N2 · Suma de ángulos interiores",  curta: "Ángulos interiores",           sesion: "P·N2", grupo: "propostas5" },
  { id: "prop-p3-1", titulo: "Propostas 5º · Polígonos · N3 · Mosaico ou teselado",         curta: "Mosaico/teselado",             sesion: "P·N3", grupo: "propostas5" },
  { id: "prop-p3-2", titulo: "Propostas 5º · Polígonos · N3 · Valla para un xardín octogonal", curta: "Valla octogonal",           sesion: "P·N3", grupo: "propostas5" },
  // Sentido estocástico · Estatística
  { id: "prop-s1-1", titulo: "Propostas 5º · Estatística · N1 · Mascotas da clase",         curta: "Mascotas da clase",            sesion: "S·N1", grupo: "propostas5" },
  { id: "prop-s1-2", titulo: "Propostas 5º · Estatística · N1 · Táboa de frecuencias",      curta: "Táboa de frecuencias",         sesion: "S·N1", grupo: "propostas5" },
  { id: "prop-s2-1", titulo: "Propostas 5º · Estatística · N2 · Media de alturas",          curta: "Media de alturas",             sesion: "S·N2", grupo: "propostas5" },
  { id: "prop-s2-2", titulo: "Propostas 5º · Estatística · N2 · Mediana paso a paso",       curta: "Mediana",                      sesion: "S·N2", grupo: "propostas5" },
  { id: "prop-s3-1", titulo: "Propostas 5º · Estatística · N3 · A miña enquisa",            curta: "A miña enquisa",               sesion: "S·N3", grupo: "propostas5" },
  { id: "prop-s3-2", titulo: "Propostas 5º · Estatística · N3 · Transporte para vir ao cole", curta: "Transporte ao cole",         sesion: "S·N3", grupo: "propostas5" }
];

const FICHAS = [...FICHAS_XOGAMOS, ...FICHAS_PROPOSTAS5];

const GRUPOS = [
  { id: "xogamos",    titulo: "Xogamos na rúa · 5º (SdA)",            emoji: "🏃", fichas: FICHAS_XOGAMOS },
  { id: "propostas5", titulo: "Propostas competenciais · 5º · 3ºT",   emoji: "🎯", fichas: FICHAS_PROPOSTAS5 }
];

function fichasDoGrupo(grupoId) {
  const g = GRUPOS.find(x => x.id === grupoId);
  return g ? g.fichas : FICHAS;
}

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Empareja unha entrega cun alumno da listaxe.
// Estratexia: punto se contén o nome propio (token único) + 1 punto por apelido. Mínimo 1.
function matchAlumno(nomeRaw) {
  const norm = " " + normalize(nomeRaw) + " ";
  if (!norm.trim()) return null;
  let mellor = null, mellorPuntos = 0;
  for (const a of ALUMNOS_5B) {
    let puntos = 0;
    for (const t of a.tokens) {
      if (norm.indexOf(" " + t + " ") !== -1) puntos++;
    }
    if (puntos > mellorPuntos) { mellor = a; mellorPuntos = puntos; }
  }
  return mellorPuntos > 0 ? mellor : null;
}

// Empareja unha entrega cunha ficha. Tenta exacto, despois substring de palabras clave.
function matchFicha(fichaRaw) {
  const norm = normalize(fichaRaw);
  if (!norm) return null;
  // Exacto por título normalizado
  for (const f of FICHAS) {
    if (normalize(f.titulo) === norm) return f;
  }
  // Substring (a entrega contén o título completo ou viceversa)
  for (const f of FICHAS) {
    const tit = normalize(f.titulo);
    if (norm.indexOf(tit) !== -1 || tit.indexOf(norm) !== -1) return f;
  }
  // Por palabras clave de "curta"
  for (const f of FICHAS) {
    const keys = normalize(f.curta).split(" ").filter(w => w.length >= 4);
    if (keys.length && keys.every(k => norm.indexOf(k) !== -1)) return f;
  }
  return null;
}

function classNota(n) {
  if (n == null) return "";
  if (n >= 7) return "apr";
  if (n >= 5) return "med";
  return "sus";
}

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
      const vista = url.searchParams.get("vista") || "alumnos"; // alumnos | matriz | flat
      const grupoSel = url.searchParams.get("grupo") || "xogamos"; // xogamos | propostas5
      const fichasVisibles = fichasDoGrupo(grupoSel);
      const entregas = await listarTodo(env);

      // Construír matriz alumno × ficha (só fichas do grupo seleccionado)
      const matriz = {};
      ALUMNOS_5B.forEach(a => { matriz[a.key] = {}; fichasVisibles.forEach(f => { matriz[a.key][f.id] = []; }); });
      const senAsignar = [];
      for (const e of entregas) {
        const a = matchAlumno(e.nome);
        const f = matchFicha(e.ficha);
        if (a && f && f.grupo === grupoSel) {
          matriz[a.key][f.id].push(e);
        } else if (!a || !f) {
          senAsignar.push({ ...e, _alumno: a ? a.nome : null, _ficha: f ? f.titulo : null });
        }
        // Se a entrega ten alumno e ficha pero é doutro grupo, omítese (xa se mostrará ao cambiar de grupo)
      }
      // Ordenar entregas por data (máis recente primeiro)
      ALUMNOS_5B.forEach(a => {
        fichasVisibles.forEach(f => {
          matriz[a.key][f.id].sort((x, y) => (y.data_recepcion || "").localeCompare(x.data_recepcion || ""));
        });
      });

      // Resumo por alumno (só fichas do grupo seleccionado)
      const resumoAlumno = ALUMNOS_5B.map(a => {
        let entregadas = 0, sumaNotas = 0, conNota = 0;
        fichasVisibles.forEach(f => {
          const arr = matriz[a.key][f.id];
          if (arr.length) {
            entregadas++;
            const ult = arr[0];
            if (ult.nota != null) { sumaNotas += Number(ult.nota); conNota++; }
          }
        });
        return { alumno: a, entregadas, total: fichasVisibles.length, media: conNota ? sumaNotas / conNota : null };
      });

      // Resumo por ficha
      const resumoFicha = fichasVisibles.map(f => {
        let n = 0;
        ALUMNOS_5B.forEach(a => { if (matriz[a.key][f.id].length) n++; });
        return { ficha: f, entregadas: n, total: ALUMNOS_5B.length };
      });

      const totalEntregas = entregas.length;
      const totalAsignadas = totalEntregas - senAsignar.length;
      const completados = resumoAlumno.filter(r => r.entregadas === fichasVisibles.length).length;
      const senNada = resumoAlumno.filter(r => r.entregadas === 0).length;

      // Render seleccionado
      let cuerpo = "";
      if (vista === "matriz") {
        cuerpo = renderMatriz(matriz, adminKey, fichasVisibles);
      } else if (vista === "flat") {
        // En vista flat mostramos só as entregas que pertencen ao grupo seleccionado (ou todas se non se pode determinar grupo)
        const entregasGrupo = entregas.filter(e => {
          const f = matchFicha(e.ficha);
          return !f || f.grupo === grupoSel;
        });
        cuerpo = renderFlat(entregasGrupo, adminKey);
      } else {
        cuerpo = renderAlumnos(resumoAlumno, matriz, adminKey, fichasVisibles);
      }

      const senAsignarHtml = senAsignar.length === 0 ? "" : `
        <details class="senasignar" open>
          <summary>⚠ <b>${senAsignar.length}</b> entregas sen alumno/ficha asignados (revisar manualmente)</summary>
          <table style="margin-top:10px">
            <tr><th>Data</th><th>Nome enviado</th><th>Curso</th><th>Ficha enviada</th><th>Nota</th><th>Acertos</th><th></th></tr>
            ${senAsignar.map(e => `<tr>
              <td>${e.data_recepcion ? new Date(e.data_recepcion).toLocaleString("gl-ES") : ""}</td>
              <td><b>${escapeHtml(e.nome)}</b>${e._alumno ? `<div class="hint">→ ${escapeHtml(e._alumno)}</div>` : ""}</td>
              <td>${escapeHtml(e.curso)}</td>
              <td>${escapeHtml(e.ficha)}${e._ficha ? `<div class="hint">→ ${escapeHtml(e._ficha)}</div>` : ""}</td>
              <td class="nota ${classNota(e.nota)}">${e.nota != null ? e.nota : "—"}</td>
              <td>${e.correctas != null ? e.correctas + "/" + e.total : ""}</td>
              <td>${e.has_html ? `<a class="btnmini" href="/ver?id=${encodeURIComponent(e.id)}&key=${adminKey}" target="_blank">📄 Ver</a>` : "—"}</td>
            </tr>`).join("")}
          </table>
        </details>`;

      return html(`
<style>
  :root { --dixi:#2e86ab; --dixi-d:#1e4650; --dixi-l:#e9f2f7; --crem:#faf7f2; --apr:#2e7530; --med:#c98a1a; --sus:#b8242e; --grey:#6b5d48; --light:#e8e2d8; --purp:#8b4a8e; --purp-d:#6a2b6e; }
  * { box-sizing:border-box }
  body { font-family:system-ui,-apple-system,sans-serif; background:var(--crem); margin:0; padding:24px; color:#2D2A26 }
  .wrap { max-width:1400px; margin:0 auto }
  h1 { color:var(--dixi); font-size:28px; margin-bottom:6px }
  .meta { color:var(--grey); font-size:14px; margin:0 0 18px }
  .meta b { color:var(--dixi-d) }

  .kpis { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:18px }
  .kpi { background:white; border-radius:12px; padding:14px 16px; box-shadow:0 2px 12px rgba(0,0,0,.05); border-left:4px solid var(--dixi) }
  .kpi .num { font-size:28px; font-weight:800; color:var(--dixi-d); line-height:1 }
  .kpi .lbl { font-size:11px; color:var(--grey); letter-spacing:1.5px; text-transform:uppercase; margin-top:6px }
  .kpi.warn { border-left-color:var(--med) }
  .kpi.danger { border-left-color:var(--sus) }
  .kpi.ok { border-left-color:var(--apr) }

  .tabs { display:flex; gap:6px; background:white; border-radius:10px; padding:4px; margin-bottom:14px; width:fit-content; box-shadow:0 2px 8px rgba(0,0,0,.04) }
  .tabs a { padding:8px 16px; border-radius:7px; text-decoration:none; color:var(--grey); font-size:13px; font-weight:600 }
  .tabs a.active { background:var(--dixi); color:white }

  .grupos-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px }
  .grupo-tab { display:inline-flex; align-items:center; gap:8px; padding:11px 18px; border-radius:10px; text-decoration:none; background:white; color:var(--grey); font-weight:700; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,.05); border:2px solid transparent }
  .grupo-tab:hover { border-color:var(--dixi); color:var(--dixi-d) }
  .grupo-tab.active { background:var(--dixi); color:white; border-color:var(--dixi-d) }
  .grupo-tab .g-count { background:rgba(0,0,0,.1); padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600 }
  .grupo-tab.active .g-count { background:rgba(255,255,255,.25); color:white }

  .botoes { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px }
  .btn { display:inline-flex; align-items:center; gap:6px; padding:9px 14px; background:var(--dixi); color:white; text-decoration:none; border-radius:8px; font-size:12.5px; font-weight:600; border:0; cursor:pointer; transition:background .15s }
  .btn:hover { background:var(--dixi-d) }
  .btn.danger { background:var(--sus) }
  .btn.danger:hover { background:#8c1b24 }
  .btn.ghost { background:white; color:var(--dixi-d); border:1.5px solid var(--dixi) }

  /* CARPETAS POR ALUMNO */
  .alumno { background:white; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,.05); margin-bottom:10px; overflow:hidden; border-left:4px solid var(--light) }
  .alumno.completo { border-left-color:var(--apr) }
  .alumno.medio { border-left-color:var(--med) }
  .alumno.vacio { border-left-color:var(--sus) }
  .alumno > summary { list-style:none; cursor:pointer; padding:14px 18px; display:flex; align-items:center; gap:14px; flex-wrap:wrap }
  .alumno > summary::-webkit-details-marker { display:none }
  .alumno > summary::before { content:"▸"; color:var(--grey); font-size:14px; transition:transform .15s }
  .alumno[open] > summary::before { transform:rotate(90deg) }
  .alumno .nome { font-weight:700; font-size:16px; color:var(--dixi-d); flex:1; min-width:200px }
  .alumno .badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:12px; background:var(--dixi-l); color:var(--dixi-d) }
  .alumno .badge.completo { background:#e8f5e8; color:var(--apr) }
  .alumno .badge.vacio { background:#fde8ea; color:var(--sus) }
  .alumno .progress { flex:1; max-width:300px; background:var(--light); height:8px; border-radius:4px; overflow:hidden; min-width:120px }
  .alumno .progress-fill { height:100%; background:linear-gradient(90deg, var(--dixi), var(--apr)); transition:width .3s }
  .alumno .nota-media { font-weight:800; font-size:18px; min-width:50px; text-align:right }
  .alumno .nota-media.apr { color:var(--apr) }
  .alumno .nota-media.med { color:var(--med) }
  .alumno .nota-media.sus { color:var(--sus) }
  .alumno-body { padding:0 18px 16px; border-top:1px solid var(--light) }
  .ficha-row { display:grid; grid-template-columns:50px 1fr 80px 70px 100px 1fr 110px; gap:10px; align-items:center; padding:10px 0; border-bottom:1px dashed var(--light); font-size:13px }
  .ficha-row:last-child { border-bottom:0 }
  .ficha-row .ses { font-size:10px; font-weight:700; color:var(--dixi); background:var(--dixi-l); padding:3px 7px; border-radius:5px; text-align:center }
  .ficha-row .titulo { font-weight:600; color:var(--dixi-d) }
  .ficha-row .titulo .sub { font-size:11px; color:var(--grey); font-weight:400 }
  .ficha-row .estado { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px }
  .ficha-row .estado.entregada { color:var(--apr) }
  .ficha-row .estado.sen { color:var(--sus) }
  .ficha-row .nota { font-weight:800; font-size:15px; text-align:center }
  .ficha-row .nota.apr { color:var(--apr) }
  .ficha-row .nota.med { color:var(--med) }
  .ficha-row .nota.sus { color:var(--sus) }
  .ficha-row .det { font-size:10.5px; color:var(--grey); font-family:ui-monospace,monospace; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
  .ficha-row.sen { background:#fcfcfc }
  .ficha-row.sen .titulo { color:var(--grey) }
  .ficha-row .vacio-msg { color:var(--grey); font-style:italic; font-size:11px }
  .multi-hint { font-size:10px; color:var(--med); font-weight:700; margin-left:6px }

  /* MATRIZ */
  .matriz-wrap { background:white; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,.05); padding:16px; overflow-x:auto }
  .matriz { border-collapse:separate; border-spacing:3px; font-size:12px; min-width:100% }
  .matriz th { background:var(--dixi); color:white; padding:8px 10px; font-size:10.5px; text-transform:uppercase; letter-spacing:1px; vertical-align:bottom; text-align:left; border-radius:6px }
  .matriz th.rotar { writing-mode:vertical-rl; transform:rotate(180deg); padding:10px 6px; min-width:36px; max-width:36px; height:140px; font-size:11px; letter-spacing:.5px; text-align:left }
  .matriz td { padding:8px 10px; background:#f7f3ee; border-radius:6px; min-width:46px; text-align:center; font-weight:700 }
  .matriz td.nome { background:var(--dixi-l); color:var(--dixi-d); text-align:left; font-size:12px; min-width:160px; padding:8px 12px }
  .matriz td.cell { font-size:13px; cursor:default; position:relative }
  .matriz td.cell.entregada.apr { background:#d4eed4; color:var(--apr) }
  .matriz td.cell.entregada.med { background:#fdebcb; color:var(--med) }
  .matriz td.cell.entregada.sus { background:#fcd6d9; color:var(--sus) }
  .matriz td.cell.entregada a { color:inherit; text-decoration:none; display:block }
  .matriz td.cell.sen { background:#f3eee7; color:#cdc4b8 }
  .matriz td.suma { background:white; color:var(--dixi-d); font-weight:800; border:1px solid var(--light) }
  .matriz tfoot td { background:white; color:var(--dixi-d); font-size:11px; padding:8px 10px; font-weight:700 }
  .matriz tfoot td.label { background:var(--dixi-l); text-align:right }

  /* FLAT */
  table.flat { width:100%; border-collapse:collapse; background:white; box-shadow:0 2px 12px rgba(0,0,0,.05); border-radius:10px; overflow:hidden }
  table.flat th { background:var(--dixi); color:white; padding:10px 12px; text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:1px }
  table.flat td { padding:10px 12px; border-bottom:1px solid var(--light); font-size:13px; vertical-align:top }
  table.flat tr:nth-child(even) td { background:#fafcfe }
  table.flat td.nota { font-weight:700; font-size:15px; text-align:center }
  table.flat td.nota.apr { color:var(--apr) }
  table.flat td.nota.med { color:var(--med) }
  table.flat td.nota.sus { color:var(--sus) }
  table.flat td.det { font-size:11px; color:var(--grey); max-width:360px; font-family:ui-monospace,monospace }

  .btnmini { display:inline-block; padding:4px 10px; background:#f5b450; color:#1e4650; text-decoration:none; border-radius:6px; font-size:11px; font-weight:700; border:0; cursor:pointer; font-family:inherit; white-space:nowrap }
  .btnmini:hover { background:#ffc97a }
  .btnmini.ghost { background:transparent; color:var(--dixi); border:1px solid var(--dixi); font-weight:600 }
  .btnmini.ghost:hover { background:var(--dixi); color:white }
  .btnmini.ia { background:var(--purp); color:white }
  .btnmini.ia:hover { background:var(--purp-d) }

  details.senasignar { background:#fff5e6; border:1px solid #f5b450; border-radius:10px; padding:12px 16px; margin-top:24px }
  details.senasignar summary { cursor:pointer; font-size:14px; color:#8a3e0c }
  details.senasignar table { background:white; border-radius:8px }
  details.senasignar .hint { font-size:10px; color:var(--med); margin-top:2px }
  .vacio { text-align:center; padding:60px; color:var(--grey); background:white; border-radius:10px }
</style>
<div class="wrap">
  <h1>📥 Buzón · Entregas de fichas · 5ºB</h1>
  <div class="meta"><b>${ALUMNOS_5B.length}</b> alumnos · <b>${fichasVisibles.length}</b> fichas no grupo · <b>${totalEntregas}</b> entregas totais (<b>${totalAsignadas}</b> asignadas globais)</div>

  <div class="grupos-tabs">
    ${GRUPOS.map(g => `<a href="/panel?key=${adminKey}&grupo=${g.id}&vista=${vista}" class="grupo-tab ${grupoSel === g.id ? 'active' : ''}">${g.emoji} ${g.titulo} <span class="g-count">${g.fichas.length}</span></a>`).join("")}
  </div>

  <div class="kpis">
    <div class="kpi ok"><div class="num">${completados}</div><div class="lbl">Completaron este grupo</div></div>
    <div class="kpi"><div class="num">${ALUMNOS_5B.length - completados - senNada}</div><div class="lbl">En progreso</div></div>
    <div class="kpi danger"><div class="num">${senNada}</div><div class="lbl">Sen entregar nada</div></div>
    <div class="kpi warn"><div class="num">${senAsignar.length}</div><div class="lbl">Sen asignar</div></div>
    <div class="kpi"><div class="num">${fichasVisibles.length ? Math.round((resumoAlumno.reduce((s,r)=>s+r.entregadas,0) / (ALUMNOS_5B.length * fichasVisibles.length)) * 100) : 0}%</div><div class="lbl">Cobertura do grupo</div></div>
  </div>

  <div class="tabs">
    <a href="/panel?key=${adminKey}&grupo=${grupoSel}&vista=alumnos" class="${vista === 'alumnos' ? 'active' : ''}">📁 Por alumno</a>
    <a href="/panel?key=${adminKey}&grupo=${grupoSel}&vista=matriz" class="${vista === 'matriz' ? 'active' : ''}">🧮 Matriz</a>
    <a href="/panel?key=${adminKey}&grupo=${grupoSel}&vista=flat" class="${vista === 'flat' ? 'active' : ''}">📋 Listaxe</a>
  </div>

  <div class="botoes">
    <a class="btn" href="/descargar?key=${adminKey}">📊 Descargar CSV</a>
    <a class="btn" href="/imprimir?key=${adminKey}" target="_blank">📄 Descargar PDF (todas)</a>
    <a class="btn ghost" href="/descargar?key=${adminKey}&format=json">{} JSON</a>
    <a class="btn danger" href="/descargar?key=${adminKey}&limpar=1" onclick="return confirm('Descargar CSV e BALEIRAR o buzón por completo? Non se pode desfacer.')">🗑 Descargar + baleirar</a>
    <a class="btn ghost" href="/panel?key=${adminKey}&grupo=${grupoSel}&vista=${vista}">↻ Actualizar</a>
  </div>

  ${cuerpo}

  ${senAsignarHtml}
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

// Render: vista carpetas por alumno
function renderAlumnos(resumoAlumno, matriz, adminKey, fichas) {
  fichas = fichas || FICHAS;
  return resumoAlumno.map(r => {
    const a = r.alumno;
    const pct = r.total ? Math.round((r.entregadas / r.total) * 100) : 0;
    const stateClass = r.entregadas === r.total ? "completo" : (r.entregadas === 0 ? "vacio" : "medio");
    const badgeClass = r.entregadas === r.total ? "completo" : (r.entregadas === 0 ? "vacio" : "");
    const mediaTxt = r.media != null ? r.media.toFixed(1) : "—";
    const mediaCl = classNota(r.media);

    const filas = fichas.map(f => {
      const arr = matriz[a.key][f.id];
      if (arr.length === 0) {
        return `<div class="ficha-row sen">
          <div class="ses">${f.sesion}</div>
          <div class="titulo">${escapeHtml(f.curta)}<div class="sub">${escapeHtml(f.titulo)}</div></div>
          <div class="estado sen">⏳ Sen entregar</div>
          <div class="nota">—</div>
          <div></div>
          <div class="vacio-msg">—</div>
          <div></div>
        </div>`;
      }
      const ult = arr[0];
      const dt = ult.data_recepcion ? new Date(ult.data_recepcion).toLocaleDateString("gl-ES") + " " + new Date(ult.data_recepcion).toLocaleTimeString("gl-ES", { hour: "2-digit", minute: "2-digit" }) : "";
      const detalle = (ult.detalle || "").replace(/</g, "&lt;");
      const ver = ult.has_html
        ? `<a class="btnmini" href="/ver?id=${encodeURIComponent(ult.id)}&key=${adminKey}" target="_blank">📄 Ver</a>`
        : "—";
      const multi = arr.length > 1 ? `<span class="multi-hint">+${arr.length - 1} intentos</span>` : "";
      return `<div class="ficha-row">
        <div class="ses">${f.sesion}</div>
        <div class="titulo">${escapeHtml(f.curta)}${multi}<div class="sub">${dt}</div></div>
        <div class="estado entregada">✅ Entregada</div>
        <div class="nota ${classNota(ult.nota)}">${ult.nota != null ? Number(ult.nota).toFixed(1) : "—"}</div>
        <div>${ult.correctas != null ? `<span class="btnmini ghost">${ult.correctas}/${ult.total}</span>` : ""}</div>
        <div class="det" title="${escapeHtml(detalle)}">${detalle.slice(0, 80)}${detalle.length > 80 ? "…" : ""}</div>
        <div>${ver}</div>
      </div>`;
    }).join("");

    return `<details class="alumno ${stateClass}">
      <summary>
        <span class="nome">${escapeHtml(a.nome)}</span>
        <span class="badge ${badgeClass}">${r.entregadas}/${r.total} fichas</span>
        <div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
        <span class="nota-media ${mediaCl}">${mediaTxt}</span>
      </summary>
      <div class="alumno-body">
        ${filas}
      </div>
    </details>`;
  }).join("");
}

// Render: vista matriz alumno × ficha
function renderMatriz(matriz, adminKey, fichas) {
  fichas = fichas || FICHAS;
  const cabeceira = `<tr>
    <th style="min-width:160px">Alumno</th>
    ${fichas.map(f => `<th class="rotar" title="${escapeHtml(f.titulo)}">${f.sesion} · ${escapeHtml(f.curta)}</th>`).join("")}
    <th style="min-width:60px">Total</th>
    <th style="min-width:60px">Media</th>
  </tr>`;

  const filas = ALUMNOS_5B.map(a => {
    let entregadas = 0, suma = 0, conNota = 0;
    const cells = fichas.map(f => {
      const arr = matriz[a.key][f.id] || [];
      if (arr.length === 0) {
        return `<td class="cell sen" title="Sen entregar">—</td>`;
      }
      entregadas++;
      const ult = arr[0];
      if (ult.nota != null) { suma += Number(ult.nota); conNota++; }
      const cl = classNota(ult.nota);
      const txt = ult.nota != null ? Number(ult.nota).toFixed(1) : "✓";
      const tooltip = `${a.nome} · ${f.curta}\nNota: ${ult.nota ?? "—"}\nAcertos: ${ult.correctas != null ? ult.correctas + "/" + ult.total : "—"}\nData: ${ult.data_recepcion ? new Date(ult.data_recepcion).toLocaleString("gl-ES") : ""}`;
      const link = ult.has_html
        ? `<a href="/ver?id=${encodeURIComponent(ult.id)}&key=${adminKey}" target="_blank" title="${escapeHtml(tooltip)}">${txt}</a>`
        : `<span title="${escapeHtml(tooltip)}">${txt}</span>`;
      return `<td class="cell entregada ${cl}">${link}</td>`;
    }).join("");
    const media = conNota ? (suma / conNota).toFixed(1) : "—";
    const clMedia = classNota(conNota ? suma / conNota : null);
    return `<tr>
      <td class="nome">${escapeHtml(a.nome)}</td>
      ${cells}
      <td class="suma">${entregadas}/${fichas.length}</td>
      <td class="suma ${clMedia}">${media}</td>
    </tr>`;
  }).join("");

  // Fila de totais por ficha
  const totaisFicha = fichas.map(f => {
    const n = ALUMNOS_5B.filter(a => (matriz[a.key][f.id] || []).length > 0).length;
    return `<td class="suma">${n}/${ALUMNOS_5B.length}</td>`;
  }).join("");

  return `<div class="matriz-wrap"><table class="matriz">
    <thead>${cabeceira}</thead>
    <tbody>${filas}</tbody>
    <tfoot><tr><td class="label">Entregadas por ficha</td>${totaisFicha}<td></td><td></td></tr></tfoot>
  </table></div>`;
}

// Render: vista plana clásica (todas as entregas, ordenadas por data)
function renderFlat(entregas, adminKey) {
  if (entregas.length === 0) return '<div class="vacio">Aínda non hai ningunha entrega.</div>';
  const filas = entregas.map(e => {
    const cl = classNota(e.nota);
    const d = e.data_recepcion ? new Date(e.data_recepcion).toLocaleString("gl-ES") : "";
    const detalle = (e.detalle || "").replace(/</g, "&lt;");
    return `<tr>
      <td>${d}</td>
      <td><b>${escapeHtml(e.nome)}</b></td>
      <td>${escapeHtml(e.curso)}</td>
      <td>${escapeHtml(e.ficha)}</td>
      <td class="nota ${cl}">${e.nota != null ? e.nota : "—"}</td>
      <td>${e.correctas != null ? e.correctas + "/" + e.total : ""}</td>
      <td class="det">${detalle.slice(0, 200)}${detalle.length > 200 ? "…" : ""}</td>
      <td>${e.has_html ? `<a class="btnmini" href="/ver?id=${encodeURIComponent(e.id)}&key=${adminKey}" target="_blank">📄 Ver</a>` : "—"}</td>
    </tr>`;
  }).join("");
  return `<table class="flat">
    <tr><th>Data</th><th>Alumno</th><th>Curso</th><th>Ficha</th><th>Nota</th><th>Acertos</th><th>Detalle</th><th></th></tr>
    ${filas}
  </table>`;
}
