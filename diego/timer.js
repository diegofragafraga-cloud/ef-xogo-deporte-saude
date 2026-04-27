/* timer.js — Conta atrás diaria compartida polos xogos interactivos.
 * 15 minutos por día. Persistencia en localStorage.
 * Conta tempo só nos xogos (rutas baixo /xogos/), na landing só mostra. */
(function () {
  const LIMIT = 15 * 60;            // 15 min en segundos
  const KEY_DATE = 'ef_xogos_date';
  const KEY_USED = 'ef_xogos_used';
  const KEY_FIRST_TODAY = 'ef_xogos_first_today';

  const today = new Date().toISOString().slice(0, 10);

  // Reset diario
  if (localStorage.getItem(KEY_DATE) !== today) {
    localStorage.setItem(KEY_DATE, today);
    localStorage.setItem(KEY_USED, '0');
    localStorage.removeItem(KEY_FIRST_TODAY);
  }

  let used = parseInt(localStorage.getItem(KEY_USED) || '0', 10);
  let lastSave = used;
  let blocked = false;
  let warned1min = false;
  let tickInterval = null;
  let badgeEl = null;
  let badgeTxt = null;

  // É unha páxina de xogo (conta tempo) ou landing (só amosa)?
  const isGame = /\/xogos\//.test(location.pathname);

  function fmt(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }
  function remaining() { return Math.max(0, LIMIT - used); }

  function injectStyles() {
    const css = document.createElement('style');
    css.textContent = `
      #efTempoBadge{
        position:fixed;left:50%;bottom:14px;transform:translateX(-50%);
        z-index:99;background:rgba(15,19,28,.92);backdrop-filter:blur(6px);
        color:#34d399;padding:8px 16px;border-radius:99px;
        border:1px solid rgba(52,211,153,.35);font-weight:700;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
        font-size:.84rem;display:flex;gap:6px;align-items:center;
        box-shadow:0 8px 24px rgba(0,0,0,.4);transition:color .3s,border-color .3s;
        user-select:none;pointer-events:none;
      }
      #efTempoBadge.warn{color:#f59e0b;border-color:rgba(245,158,11,.45)}
      #efTempoBadge.danger{color:#ef4444;border-color:rgba(239,68,68,.55);animation:efPulse 1s infinite}
      #efTempoBadge .ef-ico{font-size:1rem;line-height:1}
      @keyframes efPulse{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.06)}}
      .ef-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:efFadeIn .25s}
      .ef-modal{background:#13161f;border:1px solid #252a3a;border-radius:16px;padding:30px 26px;max-width:420px;width:100%;text-align:center;color:#e8eaf0;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
        box-shadow:0 24px 60px rgba(0,0,0,.6)}
      .ef-modal .ef-emoji{font-size:3.4rem;line-height:1;margin-bottom:14px}
      .ef-modal h2{font-size:1.35rem;margin-bottom:10px;font-weight:700}
      .ef-modal p{color:#8b92a8;margin-bottom:20px;line-height:1.5;font-size:.92rem}
      .ef-modal .ef-stats{background:#1c2030;border:1px solid #252a3a;border-radius:10px;padding:12px;margin-bottom:18px;font-size:.85rem}
      .ef-modal .ef-stats strong{color:#34d399;font-size:1.4rem;display:block}
      .ef-modal button{background:#10b981;color:#fff;border:none;padding:10px 24px;border-radius:10px;
        cursor:pointer;font-weight:700;font-family:inherit;font-size:.95rem;transition:background .15s}
      .ef-modal button:hover{background:#34d399}
      .ef-modal button.ef-secondary{background:#1c2030;color:#e8eaf0;margin-left:8px}
      .ef-modal button.ef-secondary:hover{background:#252a3a}
      @keyframes efFadeIn{from{opacity:0}to{opacity:1}}
      body.ef-blocked{overflow:hidden}
      body.ef-blocked > *:not(.ef-modal-bg):not(#efTempoBadge){pointer-events:none;filter:blur(4px) grayscale(.4);transition:filter .3s}
    `;
    document.head.appendChild(css);
  }

  function createBadge() {
    badgeEl = document.createElement('div');
    badgeEl.id = 'efTempoBadge';
    badgeEl.innerHTML = '<span class="ef-ico">⏱</span> <span id="efTempoTxt"></span>';
    document.body.appendChild(badgeEl);
    badgeTxt = document.getElementById('efTempoTxt');
  }

  function updateBadge() {
    if (!badgeTxt) return;
    const r = remaining();
    badgeTxt.textContent = fmt(r);
    badgeEl.classList.toggle('warn',   r <= 5 * 60 && r > 60);
    badgeEl.classList.toggle('danger', r <= 60);
  }

  function showModal({ emoji, title, body, primary, secondary, onPrimary, onSecondary, blocking }) {
    const bg = document.createElement('div');
    bg.className = 'ef-modal-bg';
    bg.innerHTML = `
      <div class="ef-modal">
        <div class="ef-emoji">${emoji}</div>
        <h2>${title}</h2>
        ${body}
        <div>
          <button class="ef-primary">${primary}</button>
          ${secondary ? `<button class="ef-secondary">${secondary}</button>` : ''}
        </div>
      </div>`;
    document.body.appendChild(bg);
    if (blocking) document.body.classList.add('ef-blocked');
    bg.querySelector('.ef-primary').onclick = () => {
      bg.remove();
      if (!blocking) document.body.classList.remove('ef-blocked');
      if (onPrimary) onPrimary();
    };
    if (secondary) {
      bg.querySelector('.ef-secondary').onclick = () => {
        bg.remove();
        if (!blocking) document.body.classList.remove('ef-blocked');
        if (onSecondary) onSecondary();
      };
    }
  }

  function blockGame() {
    if (blocked) return;
    blocked = true;
    stopTick();
    saveUsed(true);
    showModal({
      emoji: '🚫',
      title: 'Tempo esgotado!',
      body: `<p>Acabáronse os 15 minutos diarios de xogo. ¡Bo traballo!<br>Volve mañá para xogar máis.</p>`,
      primary: 'Voltar á páxina principal',
      blocking: true,
      onPrimary: () => { location.href = '../xogos-interactivos.html'; }
    });
  }

  function showWelcome() {
    const r = remaining();
    showModal({
      emoji: '⏱',
      title: 'Empeza a túa conta atrás',
      body: `<p>Hoxe podes xogar <strong>15 minutos</strong> en total entre todos os xogos.<br>Aproveita ben o tempo: a partires de agora xa está a contar.</p>
        <div class="ef-stats"><strong>${fmt(r)}</strong>tempo dispoñible</div>`,
      primary: 'Vamos!',
      blocking: false,
    });
    localStorage.setItem(KEY_FIRST_TODAY, '1');
  }

  function saveUsed(force) {
    if (force || used - lastSave >= 2) {
      try { localStorage.setItem(KEY_USED, String(used)); } catch (_) {}
      lastSave = used;
    }
  }

  function startTick() {
    if (tickInterval) return;
    tickInterval = setInterval(() => {
      if (blocked || document.hidden) return;
      used++;
      saveUsed(false);
      updateBadge();
      const r = remaining();
      if (r <= 60 && !warned1min && r > 0) {
        warned1min = true;
        // aviso non bloqueante
        showModal({
          emoji: '⏰',
          title: 'Queda 1 minuto!',
          body: `<p>O tempo está a piques de acabar.<br>Aproveita os últimos segundos!</p>`,
          primary: 'Vale!',
          blocking: false,
        });
      }
      if (r === 0) blockGame();
    }, 1000);
  }
  function stopTick() {
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
  }

  window.addEventListener('beforeunload', () => saveUsed(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveUsed(true); });

  function init() {
    injectStyles();
    if (isGame && used >= LIMIT) {
      // Xa esgotou ao entrar
      blocked = true;
      createBadge(); updateBadge();
      showModal({
        emoji: '🚫',
        title: 'Acabouse o tempo de hoxe',
        body: `<p>Hoxe xa usaches os <strong>15 minutos</strong> diarios de xogos.<br>Volve mañá! 👋</p>`,
        primary: 'Voltar á páxina principal',
        blocking: true,
        onPrimary: () => { location.href = '../xogos-interactivos.html'; }
      });
      return;
    }
    createBadge();
    updateBadge();
    if (isGame) {
      startTick();
      // Modal de benvida só a 1.ª entrada do día
      if (!localStorage.getItem(KEY_FIRST_TODAY)) showWelcome();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
