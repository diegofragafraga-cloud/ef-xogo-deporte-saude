/*
  MURDOCUS — Datos dos casos (bilingüe gl/es)
  ------------------------------------------------------------------
  Cada caso é un "puzzle de lóxica" (emparellamento biunívoco):
  cada sospeitoso ocupa UNHA opción da columna, sen repetir.
  As pistas permiten deducir o emparellamento por eliminación e,
  coa "pistaFinal", identificar o culpable.

  TODA a lóxica funciona con ÍNDICES (non con nomes), así o idioma
  só cambia as etiquetas que se debuxan, nunca a solución.

  - sospechosos / opciones / declaraciones / pistas: {gl:[...], es:[...]}
  - solucion: array onde solucion[s] = o  (o sospeitoso s ocupa a opción o)
  - culpable: índice dentro de sospechosos
  - restricciones: codificación máquina das pistas para o validador
        ["pos", s, o]  -> o sospeitoso s SI ocupa a opción o
        ["neg", s, o]  -> o sospeitoso s NON ocupa a opción o

  IMPORTANTE: ao engadir/editar un caso, executa `node validar.mjs`
  para confirmar que a solución é ÚNICA antes de publicar.
*/

const TEMAS = {
  animales:  { color: "#16a34a", colorBg: "#dcfce7", etiqueta: { gl: "Animais",     es: "Animales"  } },
  escolar:   { color: "#2563eb", colorBg: "#dbeafe", etiqueta: { gl: "Cole / EF",   es: "Cole / EF" } },
  cuentos:   { color: "#9333ea", colorBg: "#f3e8ff", etiqueta: { gl: "Contos",      es: "Cuentos"   } },
  cotidiano: { color: "#ea580c", colorBg: "#ffedd5", etiqueta: { gl: "Casa",        es: "Casa"      } },
  intereses: { color: "#15803d", colorBg: "#d1fae5", etiqueta: { gl: "Minecraft",   es: "Minecraft" } },
  arte:      { color: "#db2777", colorBg: "#fce7f3", etiqueta: { gl: "Arte",        es: "Arte"      } },
};

const CASOS = [
  // ===================== NIVEL 1 · 3×3 =====================
  {
    id: "zanahorias", nivel: 1, tema: "animales",
    titulo: { gl: "O misterio das cenorias", es: "El misterio de las zanahorias" },
    intro: {
      gl: "Na granxa faltan as cenorias da horta. Tres animais estaban preto e cada un comía algo distinto. Descubre quen comía cenorias.",
      es: "En la granja faltan las zanahorias de la huerta. Tres animales estaban cerca y cada uno comía algo distinto. Descubre quién comía zanahorias.",
    },
    columna: { gl: "Que comía cada un?", es: "¿Qué comía cada uno?" },
    pregunta: { gl: "Quen se comeu as cenorias?", es: "¿Quién se comió las zanahorias?" },
    sospechosos: { gl: ["Coella Lola", "Porco Tomás", "Pata Rosa"], es: ["Coneja Lola", "Cerdo Tomás", "Pata Rosa"] },
    opciones: { gl: ["Cenorias", "Mazás", "Millo"], es: ["Zanahorias", "Manzanas", "Maíz"] },
    declaraciones: {
      gl: ["Eu só pasaba por aquí saltando.", "Eu tiña moita fame esta mañá.", "Eu comín moi pouquiño, de verdade."],
      es: ["Yo solo pasaba por aquí saltando.", "Yo tenía mucha hambre esta mañana.", "Yo comí muy poquito, de verdad."],
    },
    pistas: {
      gl: ["A pata Rosa comía millo.", "O porco Tomás non comía cenorias."],
      es: ["La pata Rosa comía maíz.", "El cerdo Tomás no comía zanahorias."],
    },
    restricciones: [["pos", 2, 2], ["neg", 1, 0]],
    solucion: [0, 1, 2],
    culpable: 0,
    pistaFinal: { gl: "O culpable é quen estaba comendo cenorias.", es: "El culpable es quien estaba comiendo zanahorias." },
  },
  {
    id: "balon-recreo", nivel: 1, tema: "escolar",
    titulo: { gl: "O misterio do balón perdido", es: "El misterio del balón perdido" },
    intro: {
      gl: "Alguén deixou o balón de Educación Física fóra e mollouse coa choiva. Tres nenos estaban no recreo, cada un nun sitio. Descubre quen xogaba onde apareceu o balón.",
      es: "Alguien dejó el balón de Educación Física fuera y se mojó con la lluvia. Tres niños estaban en el recreo, cada uno en un sitio. Descubre quién jugaba donde apareció el balón.",
    },
    columna: { gl: "Onde xogaba cada un no recreo?", es: "¿Dónde jugaba cada uno en el recreo?" },
    pregunta: { gl: "Quen deixou o balón fóra?", es: "¿Quién dejó el balón fuera?" },
    sospechosos: { gl: ["Martín", "Lucía", "Hugo"], es: ["Martín", "Lucía", "Hugo"] },
    opciones: { gl: ["Pista", "Areeiro", "Soportal"], es: ["Pista", "Arenero", "Soportal"] },
    declaraciones: {
      gl: ["Eu estaba correndo todo o tempo.", "Eu estaba á sombra, tranquila.", "Eu xogaba coa area."],
      es: ["Yo estaba corriendo todo el rato.", "Yo estaba a la sombra, tranquila.", "Yo jugaba con la arena."],
    },
    pistas: {
      gl: ["Lucía xogaba no soportal.", "Martín non xogaba no areeiro."],
      es: ["Lucía jugaba en el soportal.", "Martín no jugaba en el arenero."],
    },
    restricciones: [["pos", 1, 2], ["neg", 0, 1]],
    solucion: [0, 2, 1],
    culpable: 0,
    pistaFinal: { gl: "O balón apareceu na pista; o culpable é quen xogaba alí.", es: "El balón apareció en la pista; el culpable es quien jugaba allí." },
  },
  {
    id: "manzana-blancanieves", nivel: 1, tema: "cuentos",
    titulo: { gl: "O misterio da mazá de Brancaneves", es: "El misterio de la manzana de Blancanieves" },
    intro: {
      gl: "Alguén lle deu unha trabada á mazá de Brancaneves. Tres personaxes estaban no bosque e cada un levaba algo na man. Descubre quen levaba a cesta da mazá.",
      es: "Alguien le dio un mordisco a la manzana de Blancanieves. Tres personajes estaban en el bosque y cada uno llevaba algo en la mano. Descubre quién llevaba la cesta de la manzana.",
    },
    columna: { gl: "Que levaba cada un na man?", es: "¿Qué llevaba cada uno en la mano?" },
    pregunta: { gl: "Quen trabou a mazá de Brancaneves?", es: "¿Quién mordió la manzana de Blancanieves?" },
    sospechosos: { gl: ["A Bruxa", "O Príncipe", "O Ananiño Gruñón"], es: ["La Bruja", "El Príncipe", "El Enanito Gruñón"] },
    opciones: { gl: ["Unha cesta", "Unha espada", "Un pico"], es: ["Una cesta", "Una espada", "Un pico"] },
    declaraciones: {
      gl: ["Eu non fixen nada, son moi boa.", "Eu viña montado no meu cabalo.", "Eu volvía da mina, como sempre."],
      es: ["Yo no hice nada, soy muy buena.", "Yo venía montado en mi caballo.", "Yo volvía de la mina, como siempre."],
    },
    pistas: {
      gl: ["O Príncipe levaba unha espada.", "O Ananiño Gruñón non levaba unha cesta."],
      es: ["El Príncipe llevaba una espada.", "El Enanito Gruñón no llevaba una cesta."],
    },
    restricciones: [["pos", 1, 1], ["neg", 2, 0]],
    solucion: [0, 1, 2],
    culpable: 0,
    pistaFinal: { gl: "A mazá ía na cesta; o culpable é quen levaba a cesta.", es: "La manzana iba en la cesta; el culpable es quien llevaba la cesta." },
  },

  // ===================== NIVEL 2 · 4×4 =====================
  {
    id: "tarta-cumple", nivel: 2, tema: "cotidiano",
    titulo: { gl: "O misterio do anaco de torta", es: "El misterio del trozo de tarta" },
    intro: {
      gl: "Na festa de aniversario faltaba un anaco de torta antes de cantar. Catro convidados estaban pola casa, cada un nunha habitación. Descubre quen estaba na cociña.",
      es: "En la fiesta de cumpleaños faltaba un trozo de tarta antes de cantar. Cuatro invitados estaban por la casa, cada uno en una habitación. Descubre quién estaba en la cocina.",
    },
    columna: { gl: "En que cuarto estaba cada un?", es: "¿En qué habitación estaba cada uno?" },
    pregunta: { gl: "Quen comeu o anaco de torta?", es: "¿Quién se comió el trozo de tarta?" },
    sospechosos: { gl: ["Sara", "Diego", "Noa", "Bruno"], es: ["Sara", "Diego", "Noa", "Bruno"] },
    opciones: { gl: ["Cociña", "Salón", "Xardín", "Baño"], es: ["Cocina", "Salón", "Jardín", "Baño"] },
    declaraciones: {
      gl: ["Eu estaba a ver a tele.", "Eu... eu non vin a torta, en serio.", "Eu estaba fóra collendo flores.", "Eu lavaba as mans."],
      es: ["Yo estaba viendo la tele.", "Yo... yo no vi la tarta, en serio.", "Yo estaba fuera cogiendo flores.", "Yo me lavaba las manos."],
    },
    pistas: {
      gl: ["Sara non estaba na cociña nin no xardín.", "Noa estaba no xardín.", "Bruno non estaba na cociña nin no salón.", "Diego non estaba no baño."],
      es: ["Sara no estaba en la cocina ni en el jardín.", "Noa estaba en el jardín.", "Bruno no estaba en la cocina ni en el salón.", "Diego no estaba en el baño."],
    },
    restricciones: [["neg", 0, 0], ["neg", 0, 2], ["pos", 2, 2], ["neg", 3, 0], ["neg", 3, 1], ["neg", 1, 3]],
    solucion: [1, 0, 2, 3],
    culpable: 1,
    pistaFinal: { gl: "A torta estaba na cociña; o culpable é quen estaba alí.", es: "La tarta estaba en la cocina; el culpable es quien estaba allí." },
  },
  {
    id: "cofre-minecraft", nivel: 2, tema: "intereses",
    titulo: { gl: "O misterio do cofre roto", es: "El misterio del cofre roto" },
    intro: {
      gl: "Alguén rompeu o cofre do tesouro preto dun bloque de ferro. Catro personaxes de Minecraft picaban bloques distintos. Descubre quen picaba o ferro.",
      es: "Alguien rompió el cofre del tesoro cerca de un bloque de hierro. Cuatro personajes de Minecraft picaban bloques distintos. Descubre quién picaba el hierro.",
    },
    columna: { gl: "Que bloque picaba cada un?", es: "¿Qué bloque picaba cada uno?" },
    pregunta: { gl: "Quen rompeu o cofre do tesouro?", es: "¿Quién rompió el cofre del tesoro?" },
    sospechosos: { gl: ["Steve", "Alex", "Zombi", "Creeper"], es: ["Steve", "Alex", "Zombi", "Creeper"] },
    opciones: { gl: ["Diamante", "Pedra", "Madeira", "Ferro"], es: ["Diamante", "Piedra", "Madera", "Hierro"] },
    declaraciones: {
      gl: ["Eu buscaba diamantes na cova.", "Eu cortaba árbores no bosque.", "Eu só quería sombra.", "Sssss... eu non explotei nada."],
      es: ["Yo buscaba diamantes en la cueva.", "Yo cortaba árboles en el bosque.", "Yo solo quería sombra.", "Sssss... yo no exploté nada."],
    },
    pistas: {
      gl: ["Steve picaba diamante.", "Alex non picaba pedra nin ferro.", "O Zombi non picaba madeira.", "O Creeper non picaba madeira nin pedra."],
      es: ["Steve picaba diamante.", "Alex no picaba piedra ni hierro.", "El Zombi no picaba madera.", "El Creeper no picaba madera ni piedra."],
    },
    restricciones: [["pos", 0, 0], ["neg", 1, 1], ["neg", 1, 3], ["neg", 2, 2], ["neg", 3, 2], ["neg", 3, 1]],
    solucion: [0, 2, 1, 3],
    culpable: 3,
    pistaFinal: { gl: "O cofre estaba xunto ao ferro; o culpable é quen picaba ferro.", es: "El cofre estaba junto al hierro; el culpable es quien picaba hierro." },
  },
  {
    id: "asubio-ef", nivel: 2, tema: "escolar",
    titulo: { gl: "O misterio do asubío do profe", es: "El misterio del silbato del profe" },
    intro: {
      gl: "Ao recoller o material de Educación Física, o asubío do profe apareceu enredado nas cordas. Catro alumnos recolleron material distinto. Descubre quen gardou as cordas.",
      es: "Al recoger el material de Educación Física, el silbato del profe apareció enredado en las cuerdas. Cuatro alumnos recogieron material distinto. Descubre quién guardó las cuerdas.",
    },
    columna: { gl: "Que material recolleu cada un?", es: "¿Qué material recogió cada uno?" },
    pregunta: { gl: "Quen tiña o asubío do profe?", es: "¿Quién tenía el silbato del profe?" },
    sospechosos: { gl: ["Carla", "Iago", "Nerea", "Pablo"], es: ["Carla", "Iago", "Nerea", "Pablo"] },
    opciones: { gl: ["Conos", "Aros", "Cordas", "Pelotas"], es: ["Conos", "Aros", "Cuerdas", "Pelotas"] },
    declaraciones: {
      gl: ["Eu apilei material redondo.", "Eu puxen marcas no chan.", "Eu gardei as bólas no carriño.", "Eu... non escoitei ningún asubío."],
      es: ["Yo apilé material redondo.", "Yo puse marcas en el suelo.", "Yo guardé las bolas en el carrito.", "Yo... no oí ningún silbato."],
    },
    pistas: {
      gl: ["Iago recolleu os conos.", "Carla non recolleu pelotas nin cordas.", "Nerea non recolleu aros nin cordas."],
      es: ["Iago recogió los conos.", "Carla no recogió pelotas ni cuerdas.", "Nerea no recogió aros ni cuerdas."],
    },
    restricciones: [["pos", 1, 0], ["neg", 0, 3], ["neg", 0, 2], ["neg", 2, 1], ["neg", 2, 2]],
    solucion: [1, 0, 3, 2],
    culpable: 3,
    pistaFinal: { gl: "O asubío estaba entre as cordas; o culpable é quen as gardou.", es: "El silbato estaba entre las cuerdas; el culpable es quien las guardó." },
  },

  // ===================== NIVEL 3 · 5×5 =====================
  {
    id: "zapato-cenicienta", nivel: 3, tema: "cuentos",
    titulo: { gl: "O misterio do zapato de Cincenta", es: "El misterio del zapato de Cenicienta" },
    intro: {
      gl: "Apareceu un zapato de cristal nas escaleiras do pazo. Cinco personaxes estaban no baile, cada un nun lugar distinto. Descubre a quen pertence o zapato.",
      es: "Apareció un zapato de cristal en las escaleras del palacio. Cinco personajes estaban en el baile, cada uno en un lugar distinto. Descubre a quién pertenece el zapato.",
    },
    columna: { gl: "En que parte do pazo estaba cada un?", es: "¿En qué parte del palacio estaba cada uno?" },
    pregunta: { gl: "De quen é o zapato das escaleiras?", es: "¿De quién es el zapato de las escaleras?" },
    sospechosos: { gl: ["Cincenta", "O Príncipe", "A Madrasta", "A Fada", "O Rato"], es: ["Cenicienta", "El Príncipe", "La Madrastra", "El Hada", "El Ratón"] },
    opciones: { gl: ["Salón de baile", "Cociña", "Xardín", "Escaleiras", "Carruaxe"], es: ["Salón de baile", "Cocina", "Jardín", "Escaleras", "Carruaje"] },
    declaraciones: {
      gl: ["Eu... marchei moi rápido ás doce!", "Eu bailaba toda a noite.", "Eu vixiaba que todo estivese ben.", "Eu agardaba entre as flores.", "Eu coidaba da carruaxe."],
      es: ["Yo... ¡me fui muy rápido a las doce!", "Yo bailaba toda la noche.", "Yo vigilaba que todo estuviera bien.", "Yo esperaba entre las flores.", "Yo cuidaba del carruaje."],
    },
    pistas: {
      gl: ["O Príncipe estaba no salón de baile.", "A Fada estaba no xardín.", "O Rato non estaba na cociña, nin nas escaleiras, nin no salón de baile.", "A Madrasta non estaba nas escaleiras nin na carruaxe.", "Cincenta non estaba na carruaxe."],
      es: ["El Príncipe estaba en el salón de baile.", "El Hada estaba en el jardín.", "El Ratón no estaba en la cocina, ni en las escaleras, ni en el salón de baile.", "La Madrastra no estaba en las escaleras ni en el carruaje.", "Cenicienta no estaba en el carruaje."],
    },
    restricciones: [["pos", 1, 0], ["pos", 3, 2], ["neg", 4, 1], ["neg", 4, 3], ["neg", 4, 0], ["neg", 2, 3], ["neg", 2, 4], ["neg", 0, 4]],
    solucion: [3, 0, 1, 2, 4],
    culpable: 0,
    pistaFinal: { gl: "O zapato apareceu nas escaleiras; é de quen estaba alí.", es: "El zapato apareció en las escaleras; es de quien estaba allí." },
  },
  {
    id: "trampas-gymkhana", nivel: 3, tema: "escolar",
    titulo: { gl: "O misterio das trampas na carreira", es: "El misterio de las trampas en la carrera" },
    intro: {
      gl: "Na gymkhana de Educación Física alguén fixo trampas na proba de carreira. Cinco alumnos estaban en probas distintas. Descubre quen estaba na carreira.",
      es: "En la gymkhana de Educación Física alguien hizo trampas en la prueba de carrera. Cinco alumnos estaban en pruebas distintas. Descubre quién estaba en la carrera.",
    },
    columna: { gl: "En que proba estaba cada un?", es: "¿En qué prueba estaba cada uno?" },
    pregunta: { gl: "Quen fixo trampas na carreira?", es: "¿Quién hizo trampas en la carrera?" },
    sospechosos: { gl: ["Antía", "Roi", "Uxía", "Manel", "Sara"], es: ["Antía", "Roi", "Uxía", "Manel", "Sara"] },
    opciones: { gl: ["Carreira", "Salto de lonxitude", "Lanzamento", "Relevos", "Comba"], es: ["Carrera", "Salto de longitud", "Lanzamiento", "Relevos", "Comba"] },
    declaraciones: {
      gl: ["Eu corría moi rápido, claro.", "Eu saltaba o máis lonxe posible.", "Eu daba á comba sen parar.", "Eu lanzaba a pelota con forza.", "Eu agardaba o testemuño dos relevos."],
      es: ["Yo corría muy rápido, claro.", "Yo saltaba lo más lejos posible.", "Yo daba a la comba sin parar.", "Yo lanzaba la pelota con fuerza.", "Yo esperaba el testigo de los relevos."],
    },
    pistas: {
      gl: ["Roi estaba no salto de lonxitude.", "Manel estaba no lanzamento.", "Uxía non estaba na carreira nin nos relevos.", "Sara non estaba na carreira nin na comba.", "Antía non estaba na comba."],
      es: ["Roi estaba en el salto de longitud.", "Manel estaba en el lanzamiento.", "Uxía no estaba en la carrera ni en los relevos.", "Sara no estaba en la carrera ni en la comba.", "Antía no estaba en la comba."],
    },
    restricciones: [["pos", 1, 1], ["pos", 3, 2], ["neg", 2, 0], ["neg", 2, 3], ["neg", 4, 0], ["neg", 4, 4], ["neg", 0, 4]],
    solucion: [0, 1, 4, 2, 3],
    culpable: 0,
    pistaFinal: { gl: "As trampas foron na carreira; o culpable é quen estaba alí.", es: "Las trampas fueron en la carrera; el culpable es quien estaba allí." },
  },
  {
    id: "bigote-museo", nivel: 3, tema: "arte",
    titulo: { gl: "O misterio do bigote no cadro", es: "El misterio del bigote en el cuadro" },
    intro: {
      gl: "Alguén lle pintou un bigote á Gioconda no museo. Cinco visitantes miraban cadros distintos. Descubre quen estaba diante da Gioconda.",
      es: "Alguien le pintó un bigote a la Gioconda en el museo. Cinco visitantes miraban cuadros distintos. Descubre quién estaba delante de la Gioconda.",
    },
    columna: { gl: "Que cadro miraba cada un?", es: "¿Qué cuadro miraba cada uno?" },
    pregunta: { gl: "Quen pintou o bigote na Gioconda?", es: "¿Quién pintó el bigote en la Gioconda?" },
    sospechosos: { gl: ["Olivia", "Marco", "Lúa", "Teo", "Nora"], es: ["Olivia", "Marco", "Lúa", "Teo", "Nora"] },
    opciones: { gl: ["A Gioconda", "Os xirasoles", "A noite estrelada", "As meninas", "O berro"], es: ["La Gioconda", "Los girasoles", "La noche estrellada", "Las meninas", "El grito"] },
    declaraciones: {
      gl: ["Eu... só estaba moi preto do cadro.", "Eu mirei un cadro que daba medo.", "A min gústanme as flores amarelas.", "Eu contei cantas persoas saían no cadro.", "Eu mirei o ceo cheo de estrelas... ou non?"],
      es: ["Yo... solo estaba muy cerca del cuadro.", "Yo miré un cuadro que daba miedo.", "A mí me gustan las flores amarillas.", "Yo conté cuántas personas salían en el cuadro.", "Yo miré el cielo lleno de estrellas... ¿o no?"],
    },
    pistas: {
      gl: ["Marco miraba O berro.", "Lúa miraba Os xirasoles.", "Teo non miraba A Gioconda nin A noite estrelada.", "Nora non miraba A Gioconda nin As meninas.", "Olivia non miraba A noite estrelada."],
      es: ["Marco miraba El grito.", "Lúa miraba Los girasoles.", "Teo no miraba La Gioconda ni La noche estrellada.", "Nora no miraba La Gioconda ni Las meninas.", "Olivia no miraba La noche estrellada."],
    },
    restricciones: [["pos", 1, 4], ["pos", 2, 1], ["neg", 3, 0], ["neg", 3, 2], ["neg", 4, 0], ["neg", 4, 3], ["neg", 0, 2]],
    solucion: [0, 4, 1, 3, 2],
    culpable: 0,
    pistaFinal: { gl: "O bigote pintouse na Gioconda; o culpable é quen a miraba.", es: "El bigote se pintó en la Gioconda; el culpable es quien la miraba." },
  },
];

// Exponer en navegador (window) e en Node (module.exports)
if (typeof window !== "undefined") { window.CASOS = CASOS; window.TEMAS = TEMAS; }
if (typeof module !== "undefined" && module.exports) { module.exports = { CASOS, TEMAS }; }
