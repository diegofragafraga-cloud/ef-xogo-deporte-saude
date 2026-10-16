/*
  Validador de murdokus — comproba por forza bruta que cada caso de
  casos.js ten SOLUCIÓN ÚNICA e que ningunha pista sobra.

  Uso:  node validar.mjs
*/
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Todas as permutacións de [0..n-1]
function permutacions(n) {
  const out = [];
  const rec = (actual, restantes) => {
    if (!restantes.length) { out.push(actual); return; }
    restantes.forEach((v, i) => rec([...actual, v], restantes.filter((_, j) => j !== i)));
  };
  rec([], [...Array(n).keys()]);
  return out;
}

// asig[c][s] = índice do item da categoría c asignado ao sospeitoso s
function cumpre(asig, restricions) {
  return restricions.every(([tipo, a, b, c, d]) => {
    if (tipo === "pos") return asig[a][b] === c;
    if (tipo === "neg") return asig[a][b] !== c;
    const s1 = asig[a].indexOf(b), s2 = asig[c].indexOf(d);
    if (tipo === "link")   return s1 === s2;
    if (tipo === "nolink") return s1 !== s2;
    throw new Error("Tipo de restrición descoñecido: " + tipo);
  });
}

// Proba todas as combinacións de permutacións (unha por categoría)
function resolver(caso, restricions) {
  const perms = permutacions(caso.sospeitosos.length);
  const solucions = [];
  const backtrack = (asig) => {
    if (solucions.length > 50) return;              // corte de seguridade
    if (asig.length === caso.categorias.length) {
      if (cumpre(asig, restricions)) solucions.push(asig.slice());
      return;
    }
    for (const p of perms) backtrack([...asig, p]);
  };
  backtrack([]);
  return solucions;
}

try {
  const { CASOS } = require("./casos.js");
  let erros = 0;

  for (const caso of CASOS) {
    console.log(`\n=== ${caso.id} — ${caso.titulo} ===`);
    const todas = caso.pistas.flatMap(p => p.r);
    const sols = resolver(caso, todas);
    console.log(`Solucións atopadas: ${sols.length}`);

    if (sols.length !== 1) {
      console.log("❌ A solución NON é única. Revisa as pistas.");
      sols.slice(0, 5).forEach((s, i) => console.log(`   #${i + 1}`, JSON.stringify(s)));
      erros++;
      continue;
    }
    if (JSON.stringify(sols[0]) !== JSON.stringify(caso.solucion)) {
      console.log(`❌ Solución única pero NON coincide coa declarada. Real: ${JSON.stringify(sols[0])}`);
      erros++;
      continue;
    }
    console.log("✅ Solución única e coincide coa declarada.");

    // Se ao quitar unha pista segue habendo solución única, esa pista sobra
    caso.pistas.forEach((p, i) => {
      const resto = caso.pistas.filter((_, j) => j !== i).flatMap(x => x.r);
      const n = resolver(caso, resto).length;
      console.log(`   ${i + 1}. ${n === 1 ? "⚠️  REDUNDANTE" : "✔ necesaria"} (sen ela: ${n}) — ${p.texto}`);
    });
  }
  process.exit(erros ? 1 : 0);
} catch (err) {
  console.error("Erro ao validar:", err.message);
  process.exit(1);
}
