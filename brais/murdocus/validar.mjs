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

  if (erros.length) {
    haiErros = true;
    console.log(`✗ [${c.nivel}] ${c.id}`);
    for (const e of erros) console.log(`    - ${e}`);
  } else {
    console.log(`✓ [${c.nivel}] ${c.id}  ->  culpable: ${c.sospechosos.gl[c.culpable]}`);
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
