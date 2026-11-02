// Tests da porta e da redirección móbil (functions/_middleware.js)
// Executar: node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { onRequest } from "../functions/_middleware.js";

// Contrasinal só para os tests (o real vive nos segredos de Cloudflare)
const sha = t => createHash("sha256").update(t).digest("hex");
const TOKEN = sha("espazo-diego-sesion::1234");
const ENV = { HASH_CLAVE: sha("espazo-diego::1234"), HASH_TOKEN: sha(TOKEN) };

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128 Mobile Safari/537.36";
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";

// Contexto falso: next() devolve unha páxina "servida"
async function pedir(ruta, { ua = MAC, accept = "text/html", cookie = "", metodo = "GET", cab = {}, env = ENV } = {}) {
  const headers = new Headers({ "User-Agent": ua, "Accept": accept, ...cab });
  if (cookie) headers.set("Cookie", cookie);
  const request = new Request("https://brais-e-diego.pages.dev" + ruta, { method: metodo, headers });
  let servida = false;
  const res = await onRequest({ request, env, next: async () => { servida = true; return new Response("SERVIDA", { status: 200 }); } });
  return { res, servida, corpo: await res.clone().text() };
}

test("iPhone na portada → /m/", async () => {
  const { res } = await pedir("/", { ua: IPHONE });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("Location"), "/m/");
});

test("Android en /brais/ → /m/brais/", async () => {
  const { res } = await pedir("/brais/", { ua: ANDROID });
  assert.equal(res.headers.get("Location"), "/m/brais/");
});

test("iPhone en /diego/ → /m/diego/ (antes da porta)", async () => {
  const { res } = await pedir("/diego/", { ua: IPHONE });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("Location"), "/m/diego/");
});

test("iPad e ordenador quedan na versión PC", async () => {
  for (const ua of [IPAD, MAC]) {
    const { servida } = await pedir("/", { ua });
    assert.equal(servida, true);
  }
});

test("cookie prefiro_pc → sen redirección", async () => {
  const { servida } = await pedir("/", { ua: IPHONE, cookie: "prefiro_pc=1" });
  assert.equal(servida, true);
});

test("o fetch da versión móbil non se redirixe (Accept */* ou X-Vista)", async () => {
  assert.equal((await pedir("/", { ua: IPHONE, accept: "*/*" })).servida, true);
  assert.equal((await pedir("/", { ua: IPHONE, cab: { "X-Vista": "m" } })).servida, true);
});

test("outras páxinas non se redirixen", async () => {
  const { servida } = await pedir("/patios-dins/index.html", { ua: IPHONE });
  assert.equal(servida, true);
});

test("?pc=1 garda a preferencia e quita o parámetro", async () => {
  const { res } = await pedir("/diego/?pc=1", { ua: IPHONE });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("Location"), "/diego/");
  assert.match(res.headers.get("Set-Cookie"), /prefiro_pc=1; Path=\//);
});

test("?movil=1 borra a preferencia e serve a páxina", async () => {
  const { res, servida } = await pedir("/m/?movil=1", { ua: MAC, cookie: "prefiro_pc=1" });
  assert.equal(servida, true);
  assert.match(res.headers.get("Set-Cookie"), /prefiro_pc=; Path=\/; Max-Age=0/);
});

test("/m/diego/ sen sesión → porta de contrasinal", async () => {
  const { res, servida, corpo } = await pedir("/m/diego/", { ua: IPHONE });
  assert.equal(servida, false);
  assert.equal(res.status, 200);
  assert.match(corpo, /name="clave"/);
  assert.match(corpo, /value="\/m\/diego\/"/);
});

test("/m/ e /m/brais/ son abertas", async () => {
  assert.equal((await pedir("/m/", { ua: IPHONE })).servida, true);
  assert.equal((await pedir("/m/brais/", { ua: IPHONE })).servida, true);
});

test("contrasinal incorrecto non entra e o destino externo non se acepta", async () => {
  const form = new URLSearchParams({ clave: "mal", volver: "//malo.com" });
  const request = new Request("https://brais-e-diego.pages.dev/diego/__entrar", {
    method: "POST", body: form, headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  const res = await onRequest({ request, env: ENV, next: async () => new Response("x") });
  assert.equal(res.status, 401);
  assert.match(await res.text(), /value="\/diego\/"/);
});

test("a programación compartida segue aberta", async () => {
  const { servida } = await pedir("/diego/programacion-dena-2026.html");
  assert.equal(servida, true);
});

test("contrasinal correcto → cookie para todo o sitio e volta a /m/diego/", async () => {
  const request = new Request("https://brais-e-diego.pages.dev/diego/__entrar", {
    method: "POST", body: new URLSearchParams({ clave: "1234", volver: "/m/diego/" }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  const res = await onRequest({ request, env: ENV, next: async () => new Response("x") });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get("Location"), "/m/diego/");
  assert.match(res.headers.get("Set-Cookie"), new RegExp(`espazo_diego=${TOKEN}; Path=/;`));
});

test("con sesión válida, /m/diego/ e /diego/ sérvense", async () => {
  for (const ruta of ["/m/diego/", "/diego/"]) {
    const { servida } = await pedir(ruta, { cookie: `espazo_diego=${TOKEN}` });
    assert.equal(servida, true, ruta);
  }
});

test("sen segredos configurados a porta queda pechada", async () => {
  const { servida, corpo } = await pedir("/diego/", { cookie: `espazo_diego=${TOKEN}`, env: {} });
  assert.equal(servida, false);
  assert.match(corpo, /name="clave"/);
});
