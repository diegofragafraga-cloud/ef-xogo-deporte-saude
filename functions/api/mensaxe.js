// Pages Function · Buzón de Diego (brais-e-diego.pages.dev/api/mensaxe)
// POST (público): quen visita o espazo de Diego deixa unha mensaxe.
// GET  (privado): Diego le as mensaxes desde diego/buzon/ co contrasinal da Academia.
// POST ?accion=borrar (privado): borra unha mensaxe xa lida.
// As mensaxes van no KV ENTREGAS co prefixo "mensaxe:", nunca no repo. O contrasinal
// non está en claro: compárase o SHA-256 con sal, igual ca en academia.js.

const SAL = "academia-bd::";
const HASH = "9dd9db0317c4c6c2159f2c164c5bfda411e864242ac82fd3f1e1ff6737374d32";
const PREFIXO = "mensaxe:";

const CABECEIRAS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Clave",
  "Access-Control-Max-Age": "86400"
};

export function onRequestOptions() {
  return new Response(null, { headers: CABECEIRAS });
}

async function claveValida(request) {
  const clave = request.headers.get("X-Clave") || "";
  if (!clave) return false;
  const resumo = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(SAL + clave));
  const hex = [...new Uint8Array(resumo)].map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === HASH;
}

const limpa = (v, max) => String(v || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  try {
    if (!env.ENTREGAS) return json({ ok: false, error: "KV non vinculado" }, 500);
    const url = new URL(request.url);

    if (url.searchParams.get("accion") === "borrar") {
      if (!(await claveValida(request))) return json({ ok: false, error: "Contrasinal incorrecto" }, 401);
      const id = limpa(url.searchParams.get("id"), 80);
      if (!id.startsWith(PREFIXO)) return json({ ok: false, error: "Mensaxe descoñecida" }, 400);
      await env.ENTREGAS.delete(id);
      return json({ ok: true });
    }

    const d = JSON.parse(await request.text());
    // Campo trampa: as persoas non o ven; se vén cheo, é un robot e finxímos que foi ben
    if (d.web) return json({ ok: true });
    const texto = limpa(d.texto, 3000);
    const nome = limpa(d.nome, 80);
    const contacto = limpa(d.contacto, 120);
    if (texto.length < 5) return json({ ok: false, error: "Escribe a mensaxe (polo menos unhas palabras)." }, 400);
    if (!nome) return json({ ok: false, error: "Escribe o teu nome." }, 400);

    // Límite sinxelo: 5 mensaxes por hora desde o mesmo enderezo
    const ip = request.headers.get("CF-Connecting-IP") || "x";
    const kLim = `lim:mensaxe:${ip}`;
    const n = Number(await env.ENTREGAS.get(kLim)) || 0;
    if (n >= 5) return json({ ok: false, error: "Enviaches moitas mensaxes seguidas. Proba de novo máis tarde." }, 429);
    await env.ENTREGAS.put(kLim, String(n + 1), { expirationTtl: 3600 });

    const ts = Date.now();
    const id = `${PREFIXO}${ts}:${Math.random().toString(36).slice(2, 8)}`;
    const rexistro = { nome, contacto, texto: texto.slice(0, 3000), ts };
    // Na metadata vai un anaco (límite ~1 KB) para listar cun só list(); o texto enteiro, no valor
    await env.ENTREGAS.put(id, JSON.stringify(rexistro),
      { metadata: { nome, contacto, ts, anaco: texto.slice(0, 300) } });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: "Non se puido enviar. Proba de novo." }, 400);
  }
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.ENTREGAS) return json({ ok: false, error: "KV non vinculado" }, 500);
    if (!(await claveValida(request))) return json({ ok: false, error: "Contrasinal incorrecto" }, 401);
    const out = [];
    let cursor;
    do {
      const r = await env.ENTREGAS.list({ prefix: PREFIXO, cursor });
      for (const k of r.keys) {
        let m = k.metadata || {};
        // Se o texto é longo, o enteiro está no valor
        if (!m.anaco || m.anaco.length >= 300) {
          const v = await env.ENTREGAS.get(k.name);
          if (v) m = { ...m, ...JSON.parse(v) };
        }
        out.push({ id: k.name, nome: m.nome, contacto: m.contacto, ts: m.ts, texto: m.texto || m.anaco || "" });
      }
      cursor = r.list_complete ? null : r.cursor;
    } while (cursor);
    out.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return json({ ok: true, mensaxes: out });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CABECEIRAS }
  });
}
