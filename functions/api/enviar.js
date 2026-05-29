// Pages Function · recepción de entregas no MESMO dominio (brais-e-diego.pages.dev)
// Motivo: a rede do colexio (EduXunta) bloquea *.workers.dev, polo que o envío
// directo ao worker fallaba. Aquí o POST vai ao propio pages.dev (permitido) e
// escríbese no MESMO KV (binding ENTREGAS) que le o panel do worker buzon-fichas.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

// Preflight CORS (por se algunha ficha doutro dominio postea)
export function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.ENTREGAS) {
      // KV non vinculado ao proxecto Pages
      return json({ ok: false, error: "KV ENTREGAS non vinculado" }, 500);
    }
    const data = JSON.parse(await request.text());
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const id = `entrega:${ts}:${rand}`;
    const htmlId = `html:${ts}:${rand}`;
    // Mesmo formato exacto de rexistro que o worker, para que o panel o lea igual
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

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS }
  });
}
