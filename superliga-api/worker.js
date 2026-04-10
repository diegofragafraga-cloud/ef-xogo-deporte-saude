// Worker API para Superliga Saudable
// Almacena e recupera datos compartidos en KV

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // GET /data — obter todos os datos
      if (path === '/data' && request.method === 'GET') {
        const data = await env.SUPERLIGA_KV.get('superliga_data', 'json');
        return jsonResponse(data || {});
      }

      // POST /data — gardar todos os datos
      if (path === '/data' && request.method === 'POST') {
        const body = await request.json();
        await env.SUPERLIGA_KV.put('superliga_data', JSON.stringify(body));
        return jsonResponse({ ok: true });
      }

      // POST /suxerencias — gardar unha suxerencia nova
      if (path === '/suxerencias' && request.method === 'POST') {
        const body = await request.json();
        const texto = (body.message || '').trim();
        if (!texto) return jsonResponse({ error: 'Mensaxe baleiro' }, 400);
        const lista = await env.SUPERLIGA_KV.get('suxerencias', 'json') || [];
        lista.push({ texto, data: new Date().toISOString().slice(0, 16).replace('T', ' ') });
        await env.SUPERLIGA_KV.put('suxerencias', JSON.stringify(lista));
        return jsonResponse({ ok: true, total: lista.length });
      }

      // GET /suxerencias — panel visual con suxerencias
      if (path === '/suxerencias' && request.method === 'GET') {
        const format = url.searchParams.get('format');
        const lista = await env.SUPERLIGA_KV.get('suxerencias', 'json') || [];
        if (format === 'json') return jsonResponse(lista);

        const html = `<!DOCTYPE html><html lang="gl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Suxerencias</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,system-ui,sans-serif;background:#0b0d13;color:#e8eaf0;min-height:100vh;padding:24px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
h1{font-size:1.3rem;font-weight:700}
h1 span{color:#fbbf24}
.actions{display:flex;gap:8px}
.btn{padding:8px 16px;border-radius:8px;border:none;font-weight:600;font-size:.85rem;cursor:pointer;display:flex;align-items:center;gap:6px}
.btn-refresh{background:#6c63ff;color:#fff}
.btn-delete{background:#f87171;color:#fff}
.btn:hover{filter:brightness(1.15)}
.count{font-size:.85rem;color:#8b92a8;margin-bottom:16px}
.list{display:flex;flex-direction:column;gap:10px}
.card{background:#13161f;border:1px solid #252a3a;border-radius:12px;padding:16px}
.card-date{font-size:.72rem;color:#8b92a8;margin-bottom:6px}
.card-text{font-size:.9rem;line-height:1.6}
.empty{text-align:center;padding:60px 24px;color:#8b92a8;font-size:.95rem}
</style></head><body>
<div class="header">
<h1>Buzón de <span>Suxerencias</span></h1>
<div class="actions">
<button class="btn btn-refresh" onclick="location.reload()">Actualizar</button>
<button class="btn btn-delete" onclick="if(confirm('Seguro que queres borrar todas as suxerencias?'))borrar()">Borrar todas</button>
</div>
</div>
<div class="count">${lista.length} suxerencia${lista.length !== 1 ? 's' : ''}</div>
<div class="list">
${lista.length === 0 ? '<div class="empty">Non hai suxerencias</div>' :
  lista.slice().reverse().map(s => '<div class="card"><div class="card-date">' + s.data + '</div><div class="card-text">' + s.texto.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div></div>').join('')}
</div>
<script>
async function borrar(){
await fetch(location.origin+'/suxerencias',{method:'DELETE'});
location.reload();
}
</script>
</body></html>`;
        return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS } });
      }

      // DELETE /suxerencias — borrar todas
      if (path === '/suxerencias' && request.method === 'DELETE') {
        await env.SUPERLIGA_KV.put('suxerencias', '[]');
        return jsonResponse({ ok: true });
      }

      // GET /ping — test de conexion
      if (path === '/ping') {
        return jsonResponse({ pong: true });
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  },
};
