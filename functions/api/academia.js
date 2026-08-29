// Pages Function · Academia de oposicións (documentos compartidos Brais + Diego)
// Os documentos gárdanse en KV (binding ENTREGAS, prefixo "academia:"), NUNCA no
// repo público de GitHub. A autenticación faise no servidor: toda petición leva o
// header X-Academia-Key e compárase o seu SHA-256 (con sal) contra HASH — o
// contrasinal nunca aparece en claro no código.

// SHA-256 de "academia-bd::" + contrasinal
const SAL = "academia-bd::";
const HASH = "9dd9db0317c4c6c2159f2c164c5bfda411e864242ac82fd3f1e1ff6737374d32";

const PREFIXO_DOC = "academia:doc:";   // metadatos (na metadata da clave KV)
const PREFIXO_FILE = "academia:file:"; // bytes do arquivo
const TAMANO_MAX = 25 * 1024 * 1024;   // límite dun valor KV (25 MiB)

const CABECEIRAS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Academia-Key",
  "Access-Control-Max-Age": "86400"
};

export function onRequestOptions() {
  return new Response(null, { headers: CABECEIRAS });
}

async function claveValida(request) {
  const clave = request.headers.get("X-Academia-Key") || "";
  if (!clave) return false;
  const datos = new TextEncoder().encode(SAL + clave);
  const resumo = await crypto.subtle.digest("SHA-256", datos);
  const hex = [...new Uint8Array(resumo)].map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === HASH;
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.ENTREGAS) return json({ ok: false, error: "KV ENTREGAS non vinculado" }, 500);
    if (!(await claveValida(request))) return json({ ok: false, error: "Contrasinal incorrecto" }, 401);

    const url = new URL(request.url);
    const accion = url.searchParams.get("accion");

    if (accion === "listar") {
      // Os metadatos viaxan na propia listaxe de claves: unha soa lectura KV
      const documentos = [];
      let cursor;
      do {
        const paxina = await env.ENTREGAS.list({ prefix: PREFIXO_DOC, cursor });
        for (const k of paxina.keys) {
          documentos.push({ id: k.name.slice(PREFIXO_DOC.length), ...(k.metadata || {}) });
        }
        cursor = paxina.list_complete ? null : paxina.cursor;
      } while (cursor);
      documentos.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
      return json({ ok: true, documentos });
    }

    if (accion === "descargar") {
      const id = url.searchParams.get("id") || "";
      const { value, metadata } = await env.ENTREGAS.getWithMetadata(PREFIXO_DOC + id);
      if (value === null) return json({ ok: false, error: "Documento non atopado" }, 404);
      const bytes = await env.ENTREGAS.get(PREFIXO_FILE + id, { type: "arrayBuffer" });
      if (bytes === null) return json({ ok: false, error: "Arquivo non atopado" }, 404);
      const meta = metadata || {};
      const nome = meta.nome || "documento";
      return new Response(bytes, {
        headers: {
          ...CABECEIRAS,
          "Content-Type": meta.tipo || "application/octet-stream",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nome)}`
        }
      });
    }

    return json({ ok: false, error: "Acción descoñecida" }, 400);
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.ENTREGAS) return json({ ok: false, error: "KV ENTREGAS non vinculado" }, 500);
    if (!(await claveValida(request))) return json({ ok: false, error: "Contrasinal incorrecto" }, 401);

    const url = new URL(request.url);
    const accion = url.searchParams.get("accion");

    if (accion === "subir") {
      const form = await request.formData();
      const arquivo = form.get("arquivo");
      if (!arquivo || typeof arquivo === "string") {
        return json({ ok: false, error: "Falta o arquivo" }, 400);
      }
      const bytes = await arquivo.arrayBuffer();
      if (bytes.byteLength > TAMANO_MAX) {
        return json({ ok: false, error: "O arquivo supera os 25 MB" }, 413);
      }
      const id = `${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      // A metadata KV limita a ~1 KB serializada: recortamos os campos de texto
      const meta = {
        nome: String(arquivo.name || "documento").slice(0, 120),
        categoria: String(form.get("categoria") || "outros").slice(0, 40),
        quen: String(form.get("quen") || "").slice(0, 20),
        descricion: String(form.get("descricion") || "").slice(0, 200),
        tipo: String(arquivo.type || "application/octet-stream").slice(0, 80),
        tamano: bytes.byteLength,
        data: new Date().toISOString()
      };
      await env.ENTREGAS.put(PREFIXO_FILE + id, bytes);
      await env.ENTREGAS.put(PREFIXO_DOC + id, "1", { metadata: meta });
      return json({ ok: true, id });
    }

    if (accion === "borrar") {
      const id = url.searchParams.get("id") || "";
      const { value } = await env.ENTREGAS.getWithMetadata(PREFIXO_DOC + id);
      if (value === null) return json({ ok: false, error: "Documento non atopado" }, 404);
      await env.ENTREGAS.delete(PREFIXO_FILE + id);
      await env.ENTREGAS.delete(PREFIXO_DOC + id);
      return json({ ok: true });
    }

    return json({ ok: false, error: "Acción descoñecida" }, 400);
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CABECEIRAS }
  });
}
