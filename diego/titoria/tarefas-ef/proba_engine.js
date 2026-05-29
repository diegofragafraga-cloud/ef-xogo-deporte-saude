/* proba_engine.js · motor dual para fichas interactivas
 *
 * MODO PROBA       — fichas con <input data-ok="..."> → corrixe e dá nota 1-10
 * MODO ENTREGA     — fichas sen data-ok → inxecta textareas nas caixas baleiras,
 *                   o alumno escribe, e ao enviar chega texto ao buzón (sen nota).
 * MODO CORRECCIÓN  — auto-completa as respostas correctas e márcaas en verde,
 *                   pensado para proxección na aula durante a corrección colectiva.
 *
 * Activación: abrir a ficha con ?modo=proba ou ?modo=correccion
 */
(function () {
  'use strict';

  // Auto-inxección de CSS e configuración por defecto (para fichas que só cargan este único script)
  try {
    var scripts = document.getElementsByTagName('script');
    var myScript = null;
    for (var si = 0; si < scripts.length; si++) {
      if (scripts[si].src && /proba_engine\.js/.test(scripts[si].src)) { myScript = scripts[si]; break; }
    }
    if (myScript) {
      var baseSrc = myScript.src.replace(/proba_engine\.js.*$/, '');
      var xaCss = false;
      var links = document.querySelectorAll('link[rel="stylesheet"]');
      for (var li = 0; li < links.length; li++) {
        if ((links[li].href || '').indexOf('proba_engine.css') !== -1) { xaCss = true; break; }
      }
      if (!xaCss) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = baseSrc + 'proba_engine.css';
        document.head.appendChild(link);
      }
    }
  } catch (e) { /* silencio */ }

  if (!window.PROBA_CONFIG) {
    window.PROBA_CONFIG = {
      endpoint: '/api/enviar',
      centro: 'CEIP de Dena',
      contacto: 'Diego Fraga'
    };
  }

  var CFG = window.PROBA_CONFIG;
  var STORE_NOMEKEY = 'proba_user';
  var STORE_NOTAKEY = 'proba_nota_' + location.pathname;
  var STORE_PENDKEY = 'proba_pendentes';

  function inputsExercicio() { return document.querySelectorAll('[data-ok]'); }
  function temExercicios() { return inputsExercicio().length > 0; }

  function nomeFicha() {
    var t = (document.title || '').trim();
    if (t) return t;
    return (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  }

  function normTexto(v) { return String(v == null ? '' : v).toLowerCase().trim().replace(/\s+/g, ' '); }
  function normNum(v) {
    if (v == null || v === '') return NaN;
    var s = String(v).replace(',', '.').replace(/\s/g, '').replace(/[^0-9.\-]/g, '');
    return parseFloat(s);
  }

  function comparar(input) {
    var ok = input.dataset.ok;
    if (ok == null) return null;
    var val = input.value;
    if (val == null || String(val).trim() === '') return false;
    var tol = parseFloat(input.dataset.okTol || '0');
    var opcions = String(ok).split('|');
    for (var i = 0; i < opcions.length; i++) {
      var esperado = opcions[i];
      var vNum = normNum(val), eNum = normNum(esperado);
      if (!isNaN(vNum) && !isNaN(eNum)) {
        if (Math.abs(vNum - eNum) <= tol + 1e-9) return true;
      }
      if (normTexto(val) === normTexto(esperado)) return true;
    }
    return false;
  }

  function recollerDetalleProba() {
    var inputs = inputsExercicio();
    var filas = [];
    inputs.forEach(function (inp, i) {
      filas.push({
        n: i + 1,
        resposta: inp.value || '',
        acerto: comparar(inp) === true
      });
    });
    return filas;
  }

  function recollerDetalleEntrega() {
    var campos = document.querySelectorAll('.proba-entrega-input');
    var filas = [];
    campos.forEach(function (tx, i) {
      var v = (tx.value || '').trim();
      if (v) filas.push({ n: i + 1, label: tx.dataset.label || '', texto: v });
    });
    return filas;
  }

  function corrixirVisual() {
    var inputs = inputsExercicio();
    var correctas = 0, baleiros = 0;
    inputs.forEach(function (inp) {
      inp.classList.remove('ok', 'fail');
      var res = comparar(inp);
      if (res === true) { inp.classList.add('ok'); correctas++; }
      else if (res === false && (inp.value || '').trim() !== '') { inp.classList.add('fail'); }
      else { baleiros++; }
    });
    var total = inputs.length;
    var nota = total ? Math.round((correctas / total) * 100) / 10 : 0;
    return { correctas: correctas, total: total, baleiros: baleiros, nota: nota };
  }

  function getCampoNome() { return document.getElementById('proba-nome'); }
  function getCampoCurso() { return document.getElementById('proba-curso'); }

  function validarAlumno() {
    var n = getCampoNome(), c = getCampoCurso();
    var nome = n ? (n.value || '').trim() : '';
    var curso = c ? (c.value || '').trim() : '';
    if (!nome) { alert('Escribe o teu NOME antes de enviar.'); if (n) n.focus(); return null; }
    if (!curso) { alert('Escribe o teu CURSO (ex: 5ºB) antes de enviar.'); if (c) c.focus(); return null; }
    return { nome: nome, curso: curso };
  }

  // ---- Cola de reintento: se o envío falla, gárdase e reenvíase soa ----
  function lerPendentes() {
    try { return JSON.parse(localStorage.getItem(STORE_PENDKEY) || '[]'); } catch (e) { return []; }
  }
  function gardarPendentes(arr) {
    try { localStorage.setItem(STORE_PENDKEY, JSON.stringify(arr)); } catch (e) { /* */ }
  }
  function postRaw(payload) {
    // Mesmo dominio (pages.dev) → sen no-cors, podemos ler a resposta {ok}
    return fetch(CFG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); })
      .then(function (j) { return !!(j && j.ok); })
      .catch(function () { return false; });
  }
  function enviar(payload) {
    if (!CFG.endpoint) return Promise.resolve({ ok: false, motivo: 'sen_endpoint' });
    return postRaw(payload).then(function (ok) {
      if (ok) return { ok: true };
      // Non chegou → gardar para reintentar
      var arr = lerPendentes();
      arr.push(payload);
      gardarPendentes(arr);
      return { ok: false, motivo: 'fetch_error' };
    });
  }
  function flushPendentes() {
    var arr = lerPendentes();
    if (!arr.length) return;
    var quedan = [];
    (function seguinte(i) {
      if (i >= arr.length) { gardarPendentes(quedan); return; }
      postRaw(arr[i]).then(function (ok) {
        if (!ok) quedan.push(arr[i]);
        seguinte(i + 1);
      });
    })(0);
  }

  function lerMellor() {
    try { return JSON.parse(localStorage.getItem(STORE_NOTAKEY) || 'null'); } catch (e) { return null; }
  }
  function gardarMellor(nota, correctas, total) {
    try {
      var actual = lerMellor();
      var novo = { nota: nota, correctas: correctas, total: total, data: new Date().toISOString() };
      if (!actual || nota > actual.nota) localStorage.setItem(STORE_NOTAKEY, JSON.stringify(novo));
    } catch (e) { /* silencio */ }
  }
  function lerAlumno() { try { return JSON.parse(localStorage.getItem(STORE_NOMEKEY) || 'null'); } catch (e) { return null; } }
  function gardarAlumno(a) { try { localStorage.setItem(STORE_NOMEKEY, JSON.stringify(a)); } catch (e) { /* */ } }

  function limparProba() {
    inputsExercicio().forEach(function (inp) {
      inp.classList.remove('ok', 'fail');
      inp.value = '';
    });
    var nn = document.querySelector('.proba-nota'); if (nn) nn.classList.remove('show');
  }

  function mostrarNota(resultado, msg) {
    var nota1 = document.querySelector('.proba-nota');
    if (!nota1) return;
    if (resultado === null) {
      // Só mensaxe
      nota1.innerHTML = '<div class="detalle" style="color:#2e7530">' + (msg || '') + '</div>';
      nota1.classList.add('show');
      return;
    }
    var clase = 'suspenso';
    if (resultado.nota >= 7) clase = 'aprobado';
    else if (resultado.nota >= 5) clase = 'medio';
    var mellor = lerMellor();
    var mellorHtml = mellor
      ? '<div class="mellor">Mellor marca: <b>' + mellor.nota.toFixed(1) + '</b> (' + mellor.correctas + '/' + mellor.total + ')</div>'
      : '';
    nota1.innerHTML =
      '<span class="grande ' + clase + '">' + resultado.nota.toFixed(1) + '</span>' +
      '<div class="detalle"><b>' + resultado.correctas + '/' + resultado.total + '</b> correctas' +
      (resultado.baleiros ? ' · ' + resultado.baleiros + ' en branco' : '') +
      '</div>' +
      (msg ? '<div class="detalle" style="margin-top:4px; color:#2e7530;">' + msg + '</div>' : '') +
      mellorHtml;
    nota1.classList.add('show');
  }

  function crearCaixaAlumno() {
    if (document.getElementById('proba-alumno-box')) return;
    var prev = lerAlumno() || { nome: '', curso: '' };
    var box = document.createElement('div');
    box.id = 'proba-alumno-box';
    box.innerHTML =
      '<div class="pa-row">' +
      '  <label>👤 Nome e apelidos <input id="proba-nome" type="text" autocomplete="name" value="' + escapeHtmlLocal(prev.nome) + '" placeholder="Ex: Laura Pérez García"></label>' +
      '  <label>🎓 Curso <input id="proba-curso" type="text" value="' + escapeHtmlLocal(prev.curso) + '" placeholder="Ex: 5ºB"></label>' +
      '</div>';
    document.body.insertBefore(box, document.body.firstChild);
  }

  // Converte caixas baleiras en textareas para modo entrega
  function inxectarTextareas() {
    var SELECTORES = '.op, .caja-op, .caja, .linea, .caixa, .caixa-op';
    var conta = 0;
    document.querySelectorAll(SELECTORES).forEach(function (div) {
      // evitar duplicar dentro de estruturas con input xa
      if (div.querySelector('input, textarea, .proba-entrega-input')) return;
      // Coller texto previo como pista (preguntas curtas metidas no div)
      var previoRaw = div.textContent || '';
      var previo = previoRaw.trim();
      var etiqueta = previo.replace(/\s+/g, ' ').slice(0, 90);
      var tx = document.createElement('textarea');
      tx.className = 'proba-entrega-input';
      tx.dataset.probaIdx = String(conta++);
      if (etiqueta) tx.dataset.label = etiqueta;
      tx.placeholder = 'Escribe aquí…';
      // Substituír o contido do div polo textarea (mantendo o div como marco)
      div.innerHTML = '';
      div.appendChild(tx);
      div.classList.add('proba-entrega-box');
    });
    return conta;
  }

  // Snapshot HTML para o buzón (modo proba ou entrega)
  function snapshotHtml(alumno, resultado, modo) {
    try {
      // Serialización de valores
      document.querySelectorAll('input').forEach(function (inp) {
        inp.setAttribute('value', inp.value || '');
      });
      document.querySelectorAll('textarea').forEach(function (tx) {
        tx.textContent = tx.value || '';
      });
      var clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll('script, .proba-panel, .proba-banner, #proba-alumno-box').forEach(function (n) { n.remove(); });
      clone.classList.remove('proba-on', 'proba-entrega');
      var bodyClone = clone.querySelector('body');
      if (bodyClone) {
        bodyClone.classList.remove('proba-on', 'proba-entrega');
        var cab = document.createElement('div');
        var nota = (resultado && resultado.nota != null) ? resultado.nota : null;
        var badgeColor, badgeText;
        if (nota == null) {
          badgeColor = '#f5b450';
          badgeText = '<div style="font-size:12px;font-weight:700">📝 ENTREGA</div>';
        } else {
          var cl = nota >= 7 ? '#7edc7e' : (nota >= 5 ? '#f5b450' : '#ff8a8a');
          badgeColor = cl;
          badgeText = '<div style="font-size:24px;font-weight:900;line-height:1">' + nota.toFixed(1) + '</div><div style="font-size:10px;font-weight:600;margin-top:2px">' + resultado.correctas + '/' + resultado.total + '</div>';
        }
        cab.setAttribute('style',
          'background:linear-gradient(135deg,#2e86ab,#1e4650);color:white;padding:14px 18px;' +
          'border-radius:10px;margin:0 0 14px;font-family:system-ui,-apple-system,sans-serif;' +
          'display:flex;justify-content:space-between;align-items:center;gap:16px;');
        cab.innerHTML =
          '<div>' +
          '  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;opacity:.85">' + (modo === 'entrega' ? 'Entrega recibida' : 'Entrega corrixida') + '</div>' +
          '  <div style="font-size:16px;font-weight:700;margin-top:4px">' + escapeHtmlLocal(alumno.nome) + '</div>' +
          '  <div style="font-size:12px;opacity:.9;margin-top:2px">' + escapeHtmlLocal(alumno.curso) + ' · ' + new Date().toLocaleString('gl-ES') + '</div>' +
          '</div>' +
          '<div style="background:' + badgeColor + ';color:#1e4650;padding:8px 14px;border-radius:8px;text-align:center;min-width:78px">' +
          badgeText +
          '</div>';
        bodyClone.insertBefore(cab, bodyClone.firstChild);
      }
      // Estilo para que respostas e textareas conserven formato na imprentación
      var styleExtra = document.createElement('style');
      styleExtra.textContent =
        '[data-ok] { border:0 !important; border-bottom:1px solid #c8d8e0 !important; background:transparent !important; color:#2D2A26; }' +
        '[data-ok].ok { background:#e8f5e8 !important; border-color:#3a8a3a !important; color:#1e5a1e !important; }' +
        '[data-ok].fail { background:#fde8ea !important; border-color:#b8242e !important; color:#7a1b22 !important; }' +
        '[data-ok]::after { content: attr(data-ok); font-size:9pt; color:#6b5d48; margin-left:4px; font-style:italic; }' +
        '[data-ok].ok::after { display:none; }' +
        '.proba-entrega-input { width:100%; min-height:40px; border:1px solid #c8d8e0; border-radius:4px; padding:6px 8px; font:inherit; background:#fafcfe; white-space:pre-wrap; display:block; }';
      var headClone = clone.querySelector('head');
      if (headClone) headClone.appendChild(styleExtra);
      return '<!DOCTYPE html>\n' + clone.outerHTML;
    } catch (e) { return ''; }
  }

  function escapeHtmlLocal(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function activar() {
    var modo = temExercicios() ? 'proba' : 'entrega';
    document.body.classList.add('proba-on');
    if (modo === 'entrega') {
      document.body.classList.add('proba-entrega');
      inxectarTextareas();
    }
    crearCaixaAlumno();

    // Banner
    if (!document.querySelector('.proba-banner')) {
      var b = document.createElement('div');
      b.className = 'proba-banner';
      b.textContent = modo === 'proba'
        ? '🎯 MODO PROBA — cumprimenta o NOME, responde e preme «📤 Enviar entrega»'
        : '📝 MODO ENTREGA — escribe o nome e cumprimenta a ficha; despois «📤 Enviar entrega»';
      document.body.appendChild(b);
    }
    // Panel
    if (!document.querySelector('.proba-panel')) {
      var p = document.createElement('div');
      p.className = 'proba-panel';
      if (modo === 'proba') {
        p.innerHTML =
          '<div class="proba-acciones">' +
          '  <button class="proba-enviar">📤 Enviar entrega</button>' +
          '  <div class="row">' +
          '    <button class="proba-corrixir">✓ Corrixir</button>' +
          '    <button class="proba-reset">↺ Reiniciar</button>' +
          '  </div>' +
          '  <div class="proba-nota"></div>' +
          '  <button class="proba-cerrar">Saír</button>' +
          '</div>';
      } else {
        p.innerHTML =
          '<div class="proba-acciones">' +
          '  <button class="proba-enviar">📤 Enviar entrega</button>' +
          '  <div class="proba-nota"></div>' +
          '  <button class="proba-cerrar">Saír</button>' +
          '</div>';
      }
      document.body.appendChild(p);

      if (modo === 'proba') {
        p.querySelector('.proba-corrixir').addEventListener('click', function () {
          var r = corrixirVisual();
          gardarMellor(r.nota, r.correctas, r.total);
          mostrarNota(r);
        });
        p.querySelector('.proba-reset').addEventListener('click', limparProba);
      }

      p.querySelector('.proba-enviar').addEventListener('click', function () {
        var alumno = validarAlumno();
        if (!alumno) return;
        gardarAlumno(alumno);

        var payload;
        if (modo === 'proba') {
          var r = corrixirVisual();
          gardarMellor(r.nota, r.correctas, r.total);
          payload = {
            nome: alumno.nome,
            curso: alumno.curso,
            ficha: nomeFicha(),
            nota: r.nota,
            correctas: r.correctas,
            total: r.total,
            detalle: recollerDetalleProba().map(function (x) {
              return (x.n + '. ' + (x.acerto ? '✓' : '✗') + ' "' + x.resposta + '"');
            }).join(' | '),
            html_snapshot: snapshotHtml(alumno, r, 'proba')
          };
        } else {
          var filas = recollerDetalleEntrega();
          payload = {
            nome: alumno.nome,
            curso: alumno.curso,
            ficha: nomeFicha(),
            nota: null,
            correctas: null,
            total: null,
            detalle: filas.map(function (f) {
              return f.n + '. ' + (f.label ? '[' + f.label + '] ' : '') + f.texto;
            }).join(' | ') || '(sen respostas)',
            html_snapshot: snapshotHtml(alumno, null, 'entrega')
          };
        }
        var btn = p.querySelector('.proba-enviar');
        btn.disabled = true;
        btn.textContent = 'Enviando…';
        enviar(payload).then(function (res) {
          btn.disabled = false;
          btn.textContent = '📤 Enviar entrega';
          var msg;
          if (res.ok) msg = '✉ Entrega enviada a ' + (CFG.contacto || 'Diego') + '.';
          else if (res.motivo === 'sen_endpoint') msg = '⚠ Endpoint non configurado.';
          else msg = '⚠ Non foi posible enviar. Inténtao de novo.';
          if (modo === 'proba') mostrarNota({ nota: payload.nota, correctas: payload.correctas, total: payload.total, baleiros: 0 }, msg);
          else mostrarNota(null, msg);
        });
      });
      p.querySelector('.proba-cerrar').addEventListener('click', desactivar);
    }
    // Mellor marca previa (só en modo proba)
    if (modo === 'proba') {
      var mellor = lerMellor();
      if (mellor) {
        var nota1 = document.querySelector('.proba-nota');
        nota1.innerHTML = '<div class="detalle">Mellor marca anterior: <b>' + mellor.nota.toFixed(1) + '</b></div>';
        nota1.classList.add('show');
      }
    }
  }

  function desactivar() {
    document.body.classList.remove('proba-on', 'proba-entrega', 'proba-correccion');
    var b = document.querySelector('.proba-banner'); if (b) b.remove();
    var p = document.querySelector('.proba-panel'); if (p) p.remove();
    var box = document.getElementById('proba-alumno-box'); if (box) box.remove();
    if (location.search.indexOf('modo=proba') !== -1 || location.search.indexOf('modo=correccion') !== -1) {
      location.href = location.pathname; // recarga sen ?modo para restaurar HTML
    }
  }

  // MODO CORRECCIÓN: auto-completa as respostas correctas e márcaas en verde.
  // Pensado para proxección colectiva na aula. Sen panel de envío, só sair.
  function activarCorreccion() {
    document.body.classList.add('proba-on', 'proba-correccion');
    var inputs = inputsExercicio();
    var temOk = inputs.length > 0;
    if (temOk) {
      inputs.forEach(function (inp) {
        var ok = inp.dataset.ok || '';
        // Colle a primeira opción válida (separadas por |)
        var primeira = String(ok).split('|')[0].trim();
        // Se a tolerancia indica que é numérica, normaliza a presentación
        var tol = parseFloat(inp.dataset.okTol || '0');
        if (!isNaN(parseFloat(primeira)) && tol >= 0 && /^[\-0-9.,\s]+$/.test(primeira)) {
          primeira = primeira.replace('.', ',');
        }
        inp.value = primeira;
        inp.classList.remove('fail');
        inp.classList.add('ok');
        inp.setAttribute('readonly', 'readonly');
        inp.setAttribute('tabindex', '-1');
      });
    }
    // Banner
    if (!document.querySelector('.proba-banner')) {
      var b = document.createElement('div');
      b.className = 'proba-banner correccion';
      b.textContent = temOk
        ? '✅ MODO CORRECCIÓN — respostas reveladas para proxectar na aula'
        : 'ℹ Esta ficha non ten solucionario automático — proxección de referencia para corrección guiada';
      document.body.appendChild(b);
    }
    // Panel mínimo: só botón sair
    if (!document.querySelector('.proba-panel')) {
      var p = document.createElement('div');
      p.className = 'proba-panel correccion';
      p.innerHTML = '<button class="proba-cerrar">↩ Saír</button>';
      document.body.appendChild(p);
      p.querySelector('.proba-cerrar').addEventListener('click', desactivar);
    }
  }

  function init() {
    // Reintentar envíos que quedaran pendentes (rede do cole, sen conexión...)
    flushPendentes();
    window.addEventListener('online', flushPendentes);
    if (location.search.indexOf('modo=correccion') !== -1) {
      activarCorreccion();
      return;
    }
    if (location.search.indexOf('modo=proba') !== -1) {
      activar();
      return;
    }
    // Botón flotante só se ten exercicios (para non confundir en fichas abertas vistas en modo normal)
    if (!temExercicios()) return;
    var p = document.createElement('div');
    p.className = 'proba-panel';
    p.innerHTML = '<button class="proba-toggle">🎯 Modo proba</button>';
    document.body.appendChild(p);
    p.querySelector('.proba-toggle').addEventListener('click', activar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
