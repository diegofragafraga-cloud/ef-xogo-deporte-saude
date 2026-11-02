// Pages Function · porta con contrasinal para o espazo de Diego (/diego/* e /m/diego/*)
// e redirección dos teléfonos á versión móbil (/m/).
// A comprobación faise no SERVIDOR: sen a cookie de sesión non se entrega
// ningún ficheiro de /diego/, aínda que alguén mire o código da páxina.
// O contrasinal non está no código (o repositorio é público): os seus resumos
// SHA-256 viven como segredos do proxecto en Cloudflare Pages:
//   HASH_CLAVE = SHA-256 de "espazo-diego::" + contrasinal
//   HASH_TOKEN = SHA-256 do token de sesión (o token vai na cookie)
// Se faltan, a porta queda pechada para todo o mundo (nunca aberta).

const COOKIE = "espazo_diego";
const RUTA_ENTRAR = "/diego/__entrar";
const DURACION = 60 * 60 * 24 * 30; // 30 días

// Páxinas de /diego/ que quedan abertas (xa teñen a súa propia porta e
// a ligazón está compartida co profesorado)
const ABERTAS = ["/diego/programacion-dena-2026"];

async function sha256(texto) {
  const resumo = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(resumo)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function lerCookie(request, nome) {
  const cab = request.headers.get("Cookie") || "";
  const par = cab.split(/;\s*/).find(c => c.startsWith(nome + "="));
  return par ? decodeURIComponent(par.slice(nome.length + 1)) : "";
}

function protexida(ruta) {
  const enDiego = ruta === "/diego" || ruta.startsWith("/diego/") ||
                  ruta === "/m/diego" || ruta.startsWith("/m/diego/");
  if (!enDiego) return false;
  return !ABERTAS.some(a => ruta === a || ruta === a + ".html");
}

// Destino seguro tras entrar: só rutas internas de /diego/ ou /m/diego/
function destinoSeguro(valor) {
  return typeof valor === "string" && (valor.startsWith("/diego") || valor.startsWith("/m/diego")) &&
    !valor.startsWith("//") ? valor : "/diego/";
}

// --- Versión móbil ---------------------------------------------------------
// As portadas PC teñen unha xemelga en /m/. Os teléfonos van alí salvo que
// escollesen a versión de ordenador (?pc=1 deixa a cookie prefiro_pc).
const PREFIRO_PC = "prefiro_pc";
const PORTADAS = {
  "/": "/m/", "/index.html": "/m/",
  "/diego": "/m/diego/", "/diego/": "/m/diego/", "/diego/index.html": "/m/diego/",
  "/brais": "/m/brais/", "/brais/": "/m/brais/", "/brais/index.html": "/m/brais/"
};

function esTelefono(request) {
  // iPad e tabletas Android quedan na versión de ordenador
  return /iPhone|iPod|Android.+Mobile|Windows Phone/i.test(request.headers.get("User-Agent") || "");
}

// Só se redirixen as cargas de páxina, nunca o fetch que fai a propia versión móbil
function destinoMovil(request, url) {
  if (request.method !== "GET") return null;
  const destino = PORTADAS[url.pathname];
  if (!destino) return null;
  if (!(request.headers.get("Accept") || "").includes("text/html")) return null;
  if (request.headers.get("X-Vista")) return null;
  if (lerCookie(request, PREFIRO_PC) === "1") return null;
  return esTelefono(request) ? destino : null;
}

function redirixir(destino, cookie) {
  const h = new Headers({ "Location": destino, "Cache-Control": "no-store", "Vary": "User-Agent, Cookie" });
  if (cookie) h.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers: h });
}

async function conCookie(resposta, cookie) {
  const r = new Response(resposta.body, resposta);
  r.headers.append("Set-Cookie", cookie);
  return r;
}

export async function onRequest(context) {
  const { request, next, env = {} } = context;
  const HASH_CLAVE = env.HASH_CLAVE || "", HASH_TOKEN = env.HASH_TOKEN || "";
  try {
    const url = new URL(request.url);

    // ?pc=1 → lembrar a versión de ordenador e quitar o parámetro
    if (url.searchParams.get("pc") === "1") {
      url.searchParams.delete("pc");
      return redirixir(url.pathname + url.search,
        `${PREFIRO_PC}=1; Path=/; Max-Age=31536000; Secure; SameSite=Lax`);
    }
    // ?movil=1 → esquecer esa preferencia
    const borrarPc = url.searchParams.get("movil") === "1"
      ? `${PREFIRO_PC}=; Path=/; Max-Age=0; Secure; SameSite=Lax` : "";

    if (!borrarPc) {
      const movil = destinoMovil(request, url);
      if (movil) return redirixir(movil);
    }

    if (!protexida(url.pathname)) return borrarPc ? conCookie(await next(), borrarPc) : next();

    // Envío do formulario
    if (url.pathname === RUTA_ENTRAR && request.method === "POST") {
      const form = await request.formData();
      const clave = String(form.get("clave") || "");
      const destino = destinoSeguro(form.get("volver"));
      if (HASH_CLAVE && await sha256("espazo-diego::" + clave) === HASH_CLAVE) {
        const token = await sha256("espazo-diego-sesion::" + clave);
        return new Response(null, {
          status: 303,
          headers: {
            "Location": destino,
            "Set-Cookie": `${COOKIE}=${token}; Path=/; Max-Age=${DURACION}; HttpOnly; Secure; SameSite=Lax`,
            "Cache-Control": "no-store"
          }
        });
      }
      return paxinaEntrada(destino, true);
    }

    // Sesión válida → servir o ficheiro
    const token = lerCookie(request, COOKIE);
    if (HASH_TOKEN && token && await sha256(token) === HASH_TOKEN) return borrarPc ? conCookie(await next(), borrarPc) : next();

    return paxinaEntrada(url.pathname + url.search, false);
  } catch (e) {
    console.error("Erro na porta de /diego/:", e);
    return new Response("Erro interno", { status: 500 });
  }
}

function escapar(t) {
  return t.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function paxinaEntrada(volver, erro) {
  const html = `<!doctype html>
<html lang="gl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Espazo de Diego</title>
<style>
:root{--bg:#0e1116;--card:#171d26;--bd:#263042;--tx:#e6e9ef;--mu:#8b95a7;--a:#10b981;--err:#f87171}
@media (prefers-color-scheme: light){:root{--bg:#f5f6f8;--card:#fff;--bd:#dde2ea;--tx:#151a21;--mu:#5d6676;--err:#dc2626}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--tx);
  font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.c{width:100%;max-width:340px;background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:28px 24px;text-align:center}
.ic{width:52px;height:52px;margin:0 auto 14px;border-radius:50%;background:color-mix(in srgb,var(--a) 15%,transparent);color:var(--a);display:grid;place-items:center}
.ic svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
h1{font-size:1.15rem;margin:0 0 4px;letter-spacing:-.01em}
p{margin:0 0 20px;color:var(--mu);font-size:.9rem}
input{width:100%;padding:12px 14px;font-size:1.4rem;letter-spacing:.4em;text-align:center;border-radius:10px;
  border:1px solid var(--bd);background:var(--bg);color:var(--tx);outline:none}
input:focus{border-color:var(--a);box-shadow:0 0 0 3px color-mix(in srgb,var(--a) 25%,transparent)}
button{width:100%;margin-top:12px;padding:12px;border:0;border-radius:10px;background:var(--a);color:#06281c;font-weight:700;font-size:1rem;cursor:pointer}
.err{color:var(--err);font-size:.85rem;margin:10px 0 0}
a{display:inline-block;margin-top:18px;color:var(--mu);font-size:.85rem;text-decoration:none}
a:hover{color:var(--tx)}
</style>
</head>
<body>
<form class="c" method="post" action="${RUTA_ENTRAR}">
  <div class="ic"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
  <h1>Espazo de Diego</h1>
  <p>Introduce o contrasinal para entrar</p>
  <input type="password" name="clave" inputmode="numeric" autocomplete="current-password" autofocus required aria-label="Contrasinal">
  <input type="hidden" name="volver" value="${escapar(volver)}">
  <button type="submit">Entrar</button>
  ${erro ? '<p class="err">Contrasinal incorrecto</p>' : ""}
  <a href="/">Volver ao Espazo educativo</a>
</form>
</body>
</html>`;
  return new Response(html, {
    status: erro ? 401 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
  });
}
