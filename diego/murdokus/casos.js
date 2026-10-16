/*
  MURDOKUS · 6º de Primaria — datos dos casos
  ---------------------------------------------------------------
  Un murdoku é un puzzle de lóxica: cada sospeitoso ocupa UNHA
  opción de cada categoría, sen repetir. As pistas permiten deducir
  todo o taboleiro por eliminación.

  Toda a lóxica traballa con ÍNDICES:
    solucion[c][s] = item da categoría c que lle toca ao sospeitoso s

  Restricións (para o validador):
    ["pos", cat, sospeitoso, item]        -> SI o ten
    ["neg", cat, sospeitoso, item]        -> NON o ten
    ["link",   catA, itemA, catB, itemB]  -> son da mesma persoa
    ["nolink", catA, itemA, catB, itemB]  -> non son da mesma persoa

  IMPORTANTE: tras engadir ou editar un caso, executar
      node validar.mjs
  para confirmar que a solución segue sendo ÚNICA.
*/

const CASOS = [
  {
    id: "chave-pavillon",
    titulo: "O misterio da chave do pavillón",
    nivel: "Nivel 1 · 4 sospeitosos",
    tempo: "15–20 min",
    intro: "Onte, ao rematar o recreo, a chave do pavillón non estaba no seu gancho e a clase de Educación Física empezou vinte minutos tarde. Catro persoas andaban por alí: cada unha estivo nun sitio distinto e levaba encima unha cousa distinta.",
    sospeitosos: [
      { nome: "Uxía",  declaracion: "Eu estiven todo o recreo cos meus asuntos, sen molestar a ninguén." },
      { nome: "Xoel",  declaracion: "Eu nin me acordaba de que existía esa chave." },
      { nome: "Noa",   declaracion: "Eu non pisei o patio, había moito vento." },
      { nome: "Antón", declaracion: "Eu pasei por moitos sitios, pero non toquei nada." },
    ],
    categorias: [
      { nome: "Onde estivo no recreo", itens: [
        { longo: "Biblioteca", curto: "Biblioteca" },
        { longo: "Pista",      curto: "Pista" },
        { longo: "Comedor",    curto: "Comedor" },
        { longo: "Horta",      curto: "Horta" },
      ]},
      { nome: "Que levaba encima", itens: [
        { longo: "Carpeta vermella",  curto: "Carpeta" },
        { longo: "Botella azul",      curto: "Botella" },
        { longo: "Gorra branca",      curto: "Gorra" },
        { longo: "Chaqueta amarela",  curto: "Chaqueta" },
      ]},
    ],
    pistas: [
      { texto: "Antón non se achegou á horta nin entrou na biblioteca.",              r: [["neg",0,3,3],["neg",0,3,0]] },
      { texto: "Noa non saíu ao patio: pasou todo o recreo baixo teito.",             r: [["neg",0,2,1],["neg",0,2,3]] },
      { texto: "Quen estivo no comedor esqueceu alí a súa botella azul.",             r: [["link",0,2,1,1]] },
      { texto: "A carpeta vermella apareceu tirada ao pé do aro de baloncesto da pista.",      r: [["link",0,1,1,0]] },
      { texto: "Antón non levaba a carpeta vermella.",                                r: [["neg",1,3,0]] },
      { texto: "Uxía non levaba encima nada de cor vermella nin azul.",               r: [["neg",1,0,0],["neg",1,0,1]] },
      { texto: "A persoa que regou as leitugas da horta levaba posta a gorra branca.", r: [["link",0,3,1,2]] },
    ],
    pistaFinal: "A chave apareceu no peto dunha chaqueta amarela colgada no colgadoiro.",
    pregunta: "Quen colleu a chave do pavillón?",
    solucion: [[3,1,0,2],[2,0,3,1]],
    culpable: 2,
    explicacion: [
      "Pola pista 2, Noa estivo na biblioteca ou no comedor; pola 1, Antón estivo na pista ou no comedor.",
      "A pista 4 di que quen estivo na pista levaba a carpeta vermella, e a 5 que Antón non a levaba: logo Antón non estivo na pista. Antón estivo no COMEDOR e, pola pista 3, levaba a botella azul.",
      "Como o comedor xa está ocupado, Noa estivo na BIBLIOTECA.",
      "Quedan a pista e a horta para Uxía e Xoel. Pola pista 6 Uxía non levaba a carpeta vermella, así que non estivo na pista: Uxía estivo na HORTA e Xoel na PISTA (coa carpeta vermella, pista 4).",
      "Pola pista 7, quen estaba na horta levaba a gorra branca: é Uxía. A única prenda que queda, a chaqueta amarela, é de Noa.",
      "A chave estaba no peto da chaqueta amarela: foi NOA quen a colleu.",
    ],
  },
];

if (typeof module !== "undefined") module.exports = { CASOS };
