/* Versión móbil do Espazo educativo de Brais e Diego.
   Non garda ningunha lista de ligazóns: le a páxina de ordenador ao abrirse
   (data-fonte no <body>) e pinta o mesmo contido noutro deseño.
   Así, cando se engade un recurso na versión PC, aparece só aquí. */
(function () {
  "use strict";

  const ICONAS = {
    lua: '<svg class="i" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
    sol: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
    busca: '<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    fr: '<svg class="i fr" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
    ligazon: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    inicio: '<svg class="i" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
    persoa: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>',
    buzon: '<svg class="i" viewBox="0 0 24 24"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    estrela: '<svg class="i" viewBox="0 0 24 24"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
    libro: '<svg class="i" viewBox="0 0 24 24"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>',
    monitor: '<svg class="i" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    mensaxe: '<svg class="i" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
  };

  // Portadas PC → a súa versión móbil
  const XEMELGAS = {
    "/": "/m/", "/index.html": "/m/",
    "/diego/": "/m/diego/", "/diego/index.html": "/m/diego/",
    "/brais/": "/m/brais/", "/brais/index.html": "/m/brais/"
  };

  const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const esc = s => String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cor = el => ([...(el.classList || [])].find(c => /^[cm]-[a-z]{2}$/.test(c)) || "");

  // Enderezo absoluto; as portadas PC cámbianse pola súa xemelga móbil
  function ruta(href, base) {
    try {
      const u = new URL(href, base);
      if (u.origin === location.origin && XEMELGAS[u.pathname]) return XEMELGAS[u.pathname];
      return u.origin === location.origin ? u.pathname + u.search + u.hash : u.href;
    } catch (e) { return href; }
  }

  // Texto limpo dunha ligazón (sen iconas, etiquetas nin frechas)
  function textoLimpo(a) {
    const c = a.cloneNode(true);
    c.querySelectorAll("svg, .ic, small, .tag, .fr, .cnt, i").forEach(n => n.remove());
    return c.textContent.replace(/\s+/g, " ").trim();
  }

  function ligazon(a, base, chip) {
    const small = a.querySelector("small");
    const tag = a.querySelector(".tag");
    const svg = a.querySelector(".ic svg");
    return {
      href: ruta(a.getAttribute("href"), base),
      texto: textoLimpo(a),
      desc: a.getAttribute("title") || (small ? small.textContent.trim() : ""),
      busca: a.getAttribute("data-b") || "",
      tag: tag ? tag.textContent.trim() : "",
      icona: svg ? svg.outerHTML : "",
      cor: cor(a),
      chip: !!chip
    };
  }

  /* Le a páxina de ordenador e devolve os seus bloques:
     [{titulo, cor, grupos:[{et, ligazons:[...]}]}] e os accesos rápidos. */
  function extraer(doc, base) {
    const seccions = [...doc.querySelectorAll("main section.col")].map(sec => {
      const h2 = sec.querySelector("h2");
      const grupos = [{ et: "", ligazons: [] }];
      [...sec.children].forEach(el => {
        if (el.matches("p.et")) grupos.push({ et: el.textContent.trim(), ligazons: [] });
        else if (el.matches("a.l")) grupos[grupos.length - 1].ligazons.push(ligazon(el, base, false));
        else if (el.matches(".chips")) el.querySelectorAll("a").forEach(a => grupos[grupos.length - 1].ligazons.push(ligazon(a, base, true)));
      });
      return {
        titulo: h2 ? textoLimpo(h2) : "",
        cor: cor(sec),
        grupos: grupos.filter(g => g.ligazons.length)
      };
    }).filter(s => s.grupos.length);

    const accesos = [...doc.querySelectorAll("main .hero a.bt, main nav.novas a.nova")]
      .filter(a => a.getAttribute("href") && a.getAttribute("href") !== "#")
      .map(a => ({ href: ruta(a.getAttribute("href"), base), texto: textoLimpo(a), cor: cor(a) }));

    return { seccions, accesos };
  }

  /* ---------- pintar ---------- */
  // et = título do grupo (p.ex. «Xogos de mapas»): tamén conta na busca
  function filaHTML(l, et) {
    const q = esc(norm([l.texto, l.desc, l.busca, l.tag, et].join(" ")));
    if (l.chip) return `<a class="chip ${l.cor}" href="${esc(l.href)}" data-q="${q}">${esc(l.texto)}</a>`;
    return `<a class="fila ${l.cor}" href="${esc(l.href)}" data-q="${q}">` +
      `<span class="ic">${l.icona || ICONAS.ligazon}</span>` +
      `<span class="tx"><b>${esc(l.texto)}${l.tag ? ` <em class="tag">${esc(l.tag)}</em>` : ""}</b>` +
      `${l.desc ? `<span>${esc(l.desc)}</span>` : ""}</span>` + ICONAS.fr + `</a>`;
  }

  function seccionHTML(s, aberta) {
    const n = s.grupos.reduce((t, g) => t + g.ligazons.length, 0);
    const corpo = s.grupos.map(g => {
      const filas = g.ligazons.filter(l => !l.chip).map(l => filaHTML(l, g.et)).join("");
      const chips = g.ligazons.filter(l => l.chip).map(l => filaHTML(l, g.et)).join("");
      return `<div class="grupo">${g.et ? `<p class="et">${esc(g.et)}</p>` : ""}${filas}${chips ? `<div class="grella">${chips}</div>` : ""}</div>`;
    }).join("");
    return `<details class="sec ${s.cor}"${aberta ? " open" : ""}><summary><span class="t">${esc(s.titulo)}</span>` +
      `<span class="n">${n}</span>${ICONAS.fr.replace('class="i fr"', 'class="i fl"')}</summary><div class="cont">${corpo}</div></details>`;
  }

  function accesoHTML(a) {
    const ic = /programaci/i.test(a.texto) ? ICONAS.libro : ICONAS.estrela;
    return `<a class="acc ${a.cor}" href="${esc(a.href)}">${ic}${esc(a.texto)}</a>`;
  }

  /* ---------- tema (o mesmo ef_theme da versión PC) ---------- */
  function tema() {
    const b = document.getElementById("mTema");
    const pon = t => {
      document.documentElement.setAttribute("data-theme", t);
      b.innerHTML = t === "dark" ? ICONAS.lua : ICONAS.sol;
      try { localStorage.setItem("ef_theme", t); } catch (e) { /* sen almacenamento */ }
    };
    let t = "dark";
    try { if (localStorage.getItem("ef_theme") === "light") t = "light"; } catch (e) { /* idem */ }
    pon(t);
    b.onclick = () => pon(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
  }

  /* ---------- busca ---------- */
  function busca() {
    const caixa = document.getElementById("mBusca"), sen = document.getElementById("mSen");
    const lembrar = new Map();
    caixa.addEventListener("input", () => {
      try {
        const q = norm(caixa.value.trim()), partes = q.split(/\s+/).filter(Boolean);
        let algun = false;
        document.querySelectorAll("details.sec").forEach(d => {
          if (!lembrar.has(d)) lembrar.set(d, d.open);
          const area = norm(d.querySelector("summary .t").textContent);
          let vis = 0;
          d.querySelectorAll("[data-q]").forEach(a => {
            const ok = !partes.length || partes.every(p => (a.dataset.q + " " + area).includes(p));
            a.classList.toggle("oculto", !ok); if (ok) vis++;
          });
          d.querySelectorAll(".grupo").forEach(g => g.classList.toggle("oculto", !g.querySelector("[data-q]:not(.oculto)")));
          d.classList.toggle("oculto", !vis);
          d.open = partes.length ? true : lembrar.get(d);
          if (vis) algun = true;
        });
        sen.classList.toggle("oculto", algun);
      } catch (e) { console.error("Busca:", e); }
    });
  }

  /* ---------- buzón (o mesmo formulario da versión PC) ---------- */
  function buzon(doc, endpoint) {
    const orixe = doc.getElementById("buzon");
    if (!orixe || !endpoint) return null;
    const d = document.importNode(orixe, true);
    document.body.appendChild(d);
    const f = d.querySelector("form"), res = d.querySelector(".resultado"), env = d.querySelector("[type=submit]");
    const pechar = d.querySelector("button[type=button]");
    if (pechar) pechar.onclick = () => d.close();
    f.addEventListener("submit", async ev => {
      ev.preventDefault();
      const datos = { nome: f.nome.value.trim(), contacto: f.contacto.value.trim(), texto: f.texto.value.trim(), web: f.web.value };
      if (!datos.nome || datos.texto.length < 5) { res.className = "resultado erro"; res.textContent = "Escribe o teu nome e a mensaxe."; return; }
      env.disabled = true; res.className = "resultado"; res.textContent = "Enviando…";
      try {
        const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });
        const j = await r.json();
        if (j.ok) { res.className = "resultado ok"; res.textContent = "Enviada. Grazas!"; f.texto.value = ""; }
        else { res.className = "resultado erro"; res.textContent = j.error || "Non se puido enviar."; }
      } catch (e) { res.className = "resultado erro"; res.textContent = "Sen conexión. Proba de novo."; }
      env.disabled = false;
    });
    return () => { res.textContent = ""; res.className = "resultado"; d.showModal(); };
  }

  /* ---------- suxerencias da portada (o mesmo Worker da versión PC) ---------- */
  function suxerencias(endpoint) {
    const d = document.createElement("dialog");
    d.innerHTML = '<form method="dialog"><h3>Buzón de suxerencias</h3><p>Déixanos a túa opinión, idea ou suxerencia.</p>' +
      '<textarea id="mSuxTx" rows="5" placeholder="Escribe aquí a túa suxerencia…"></textarea><p class="resultado" role="status"></p>' +
      '<div class="accions"><button type="button" id="mSuxNon">Cancelar</button><button type="button" class="env" id="mSuxSi">Enviar</button></div></form>';
    document.body.appendChild(d);
    const res = d.querySelector(".resultado");
    d.querySelector("#mSuxNon").onclick = () => d.close();
    d.querySelector("#mSuxSi").onclick = async function () {
      const texto = d.querySelector("#mSuxTx").value.trim();
      if (!texto) return;
      this.disabled = true; res.className = "resultado"; res.textContent = "Enviando…";
      try {
        const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: texto }) });
        res.className = r.ok ? "resultado ok" : "resultado erro";
        res.textContent = r.ok ? "Suxerencia enviada. Grazas!" : "Erro ao enviar. Inténtao de novo.";
        if (r.ok) { d.querySelector("#mSuxTx").value = ""; setTimeout(() => d.close(), 1800); }
      } catch (e) { res.className = "resultado erro"; res.textContent = "Erro de conexión. Inténtao de novo."; }
      this.disabled = false;
    };
    return () => { res.textContent = ""; d.showModal(); };
  }

  /* ---------- arranque ---------- */
  async function iniciar() {
    const cfg = document.body.dataset;
    tema();
    busca();
    const lista = document.getElementById("mLista");
    const fonte = new URL(cfg.fonte, location.href).href;
    try {
      const r = await fetch(fonte, { credentials: "same-origin", cache: "no-cache", headers: { "X-Vista": "m" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const html = await r.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      // Se a sesión caducou, o servidor devolve a porta: recargar para que a pida aquí
      if (doc.querySelector('input[name="clave"]')) {
        if (!sessionStorage.getItem("m_recarga")) { sessionStorage.setItem("m_recarga", "1"); location.reload(); return; }
        throw new Error("sen sesión");
      }
      sessionStorage.removeItem("m_recarga");
      const { seccions, accesos } = extraer(doc, fonte);
      const abertas = cfg.abertas === "todas";

      let accHTML = accesos.map(accesoHTML).join("");
      let abrir = null;
      if (cfg.buzon === "suxerencias") abrir = suxerencias(cfg.suxerencias);
      else if (cfg.buzon) abrir = buzon(doc, cfg.buzon);
      if (abrir) accHTML = `<button class="acc" type="button" id="mBuzon">${cfg.buzon === "suxerencias" ? ICONAS.mensaxe + "Suxerencias" : ICONAS.buzon + "Buzón"}</button>` + accHTML;
      document.getElementById("mAccesos").innerHTML = accHTML;
      if (abrir) document.getElementById("mBuzon").onclick = abrir;

      lista.innerHTML = seccions.map((s, i) => seccionHTML(s, abertas || i === 0)).join("");
    } catch (e) {
      console.error("Versión móbil:", e);
      lista.innerHTML = `<p class="aviso">Non se puido cargar o contido.<br><a href="${esc(cfg.pc)}">Abrir a versión de ordenador</a></p>`;
    }
  }

  window.MovilBD = { extraer, ruta, textoLimpo };
  if (document.body && document.body.dataset.fonte) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
  }
})();
