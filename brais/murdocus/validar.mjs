/*
  validar.mjs — Comprobación de calidade dos casos de MURDOCUS
  ------------------------------------------------------------------
  Para cada caso comproba, por forza bruta sobre TODAS as permutacións
  posibles do emparellamento sospeitoso↔opción:
    1) Que existe ALGUNHA solución que cumpre todas as restricciones.
    2) Que esa solución é ÚNICA (requisito dun bo puzzle de lóxica).
    3) Que a solución única coincide co campo `solucion` declarado.
    4) Coherencia de tamaños (sospechosos = opciones, declaraciones, etc.)
    5) Que o `culpable` é un índice válido.

  Uso:  node validar.mjs
  Saída: lista de casos OK / ERRO e código de saída 0/1.
*/

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { CASOS } = require("./casos.js");

// Xera todas as permutacións de [0..n-1]
function permutaciones(n) {
  const base = Array.from({ length: n }, (_, i) => i);
  const res = [];
  const gen = (actual, restantes) => {
    if (restantes.length === 0) { res.push(actual); return; }
    for (let i = 0; i < restantes.length; i++) {
      gen([...actual, restantes[i]], restantes.filter((_, j) => j !== i));
    }
  };
  gen([], base);
  return res;
}

// Comproba se unha asignación (asig[s] = o) cumpre unha restrición
function cumpre(asig, [tipo, s, o]) {
  if (tipo === "pos") return asig[s] === o;
  if (tipo === "neg") return asig[s] !== o;
  throw new Error(`Tipo de restrición descoñecido: ${tipo}`);
}

/*
  Solucionador "como un neno": só usa eliminación directa (singles).
  - Aplica as pistas (pos -> ✓, neg -> ✗).
  - Repite: cando unha fila ou columna ten un só oco baleiro, ese é ✓
    e propágase ✗ ao resto da súa fila e columna.
  Se ASÍ se resolve enteiro -> o caso é xusto para 1º ciclo (non hai que adiviñar).
  Se queda atascado -> faría falta razoamento avanzado/adiviñar: PISTA pouco amable.
  Devolve {resolto, atascado, pasos}.
*/
function resolverComoNeno(c) {
  const n = c.solucion.length;
  const st = Array.from({ length: n }, () => Array(n).fill(0)); // 0 baleiro, 1 ✓, 2 ✗
  const pasos = [];
  const S = c.sospechosos.gl, O = c.opciones.gl;
  function ponSi(s, o, motivo) {
    st[s][o] = 1;
    for (let j = 0; j < n; j++) if (j !== o && st[s][j] === 0) st[s][j] = 2;
    for (let i = 0; i < n; i++) if (i !== s && st[i][o] === 0) st[i][o] = 2;
    pasos.push(`${S[s]} → ${O[o]}  (${motivo})`);
  }
  // pistas iniciais
  for (const [t, s, o] of c.restricciones) {
    if (t === "pos") ponSi(s, o, "pista directa");
    else if (st[s][o] === 0) st[s][o] = 2;
  }
  // propagación por singles
  let cambiou = true;
  while (cambiou) {
    cambiou = false;
    for (let r = 0; r < n; r++) {
      const ocos = []; let temSi = false;
      for (let col = 0; col < n; col++) { if (st[r][col] === 1) temSi = true; if (st[r][col] === 0) ocos.push(col); }
      if (!temSi && ocos.length === 1) { ponSi(r, ocos[0], "único oco da fila"); cambiou = true; }
    }
    for (let col = 0; col < n; col++) {
      const ocos = []; let temSi = false;
      for (let r = 0; r < n; r++) { if (st[r][col] === 1) temSi = true; if (st[r][col] === 0) ocos.push(r); }
      if (!temSi && ocos.length === 1) { ponSi(ocos[0], col, "único oco da columna"); cambiou = true; }
    }
  }
  const resolto = st.every((fila, s) => fila[c.solucion[s]] === 1 && fila.filter((v) => v === 1).length === 1);
  return { resolto, atascado: !resolto, pasos };
}

let haiErros = false;

for (const c of CASOS) {
  const erros = [];
  const nS = c.sospechosos.gl.length;
  const nO = c.opciones.gl.length;

  // ---- Coherencia estrutural ----
  if (nS !== nO) erros.push(`sospechosos (${nS}) != opciones (${nO})`);
  for (const idioma of ["gl", "es"]) {
    if (c.sospechosos[idioma].length !== nS) erros.push(`sospechosos.${idioma} tamaño incorrecto`);
    if (c.opciones[idioma].length !== nO) erros.push(`opciones.${idioma} tamaño incorrecto`);
    if (c.declaraciones[idioma].length !== nS) erros.push(`declaraciones.${idioma} tamaño incorrecto`);
    if (!c.titulo[idioma] || !c.intro[idioma] || !c.pregunta[idioma] || !c.pistaFinal[idioma] || !c.columna[idioma]) {
      erros.push(`falta texto en idioma ${idioma}`);
    }
  }
  if (!Array.isArray(c.solucion) || c.solucion.length !== nS) erros.push("solucion con tamaño incorrecto");
  if (typeof c.culpable !== "number" || c.culpable < 0 || c.culpable >= nS) erros.push("culpable fóra de rango");

  // ---- Busca de solucións válidas ----
  const perms = permutaciones(nS);
  const validas = perms.filter((asig) => c.restricciones.every((r) => cumpre(asig, r)));

  if (validas.length === 0) {
    erros.push("NON ten solución (as pistas contradinse)");
  } else if (validas.length > 1) {
    erros.push(`ten ${validas.length} solucións (debe ser ÚNICA) -> p.ex. ${JSON.stringify(validas.slice(0, 3))}`);
  } else {
    // Solución única: debe coincidir coa declarada
    const unica = validas[0];
    if (JSON.stringify(unica) !== JSON.stringify(c.solucion)) {
      erros.push(`solución única ${JSON.stringify(unica)} != solucion declarada ${JSON.stringify(c.solucion)}`);
    }
  }

  // ---- Restricións referenciando índices válidos ----
  for (const [tipo, s, o] of c.restricciones) {
    if (s < 0 || s >= nS || o < 0 || o >= nO) erros.push(`restrición [${tipo},${s},${o}] fóra de rango`);
  }

  // ---- Resoluble por eliminación directa (sen adiviñar)? ----
  const r = resolverComoNeno(c);
  if (!r.resolto) erros.push("NON se resolve só por eliminación (faría falta adiviñar): pista pouco amable para 1º ciclo");

  if (erros.length) {
    haiErros = true;
    console.log(`✗ [${c.nivel}] ${c.id}`);
    for (const e of erros) console.log(`    - ${e}`);
  } else {
    console.log(`✓ [${c.nivel}] ${c.id}  ->  culpable: ${c.sospechosos.gl[c.culpable]}`);
    r.pasos.forEach((p, i) => console.log(`      ${i + 1}. ${p}`));
  }
}

console.log(`\n${CASOS.length} casos comprobados.`);
if (haiErros) {
  console.log("RESULTADO: HAI ERROS. Non publicar ata corrixilos.");
  process.exit(1);
} else {
  console.log("RESULTADO: TODOS OS CASOS son válidos (solución única e coherente).");
  process.exit(0);
}
