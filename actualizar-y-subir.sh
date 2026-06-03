#!/usr/bin/env bash
# actualizar-y-subir.sh — Sincroniza co repo común e publica (auto-deploy).
#
# Uso:
#   ./actualizar-y-subir.sh "mensaxe de commit"   # garda os teus cambios, sincroniza e sobe
#   ./actualizar-y-subir.sh                         # só sincroniza e sobe o xa commiteado
#
# Por que: con dúas persoas no mesmo repo, hai que TRAER (pull) antes de SUBIR (push).
# Este script faino na orde correcta e para se hai un conflito, para non romper nada.

set -euo pipefail

# 1) Estamos dentro do repositorio?
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Non estás dentro do repositorio. Vai á carpeta do proxecto e volve a executar."
  exit 1
fi

RAMA="$(git branch --show-current)"
echo "📍 Rama: $RAMA"

# 2) Hai cambios sen gardar?
if [ -n "$(git status --porcelain)" ]; then
  if [ "$#" -ge 1 ] && [ -n "${1:-}" ]; then
    echo "💾 Gardando os teus cambios: \"$1\""
    git add -A
    git commit -m "$1"
  else
    echo "⚠  Tes cambios sen gardar. Dáme unha mensaxe para commitealos, por exemplo:"
    echo "     ./actualizar-y-subir.sh \"actualizo a ficha de tal cousa\""
    exit 1
  fi
else
  echo "✓ Non hai cambios sen gardar."
fi

# 3) Traer o traballo do compañeiro (rebase = historial limpo)
echo "⬇  Sincronizando co repo común…"
if ! git pull --rebase --autostash; then
  echo ""
  echo "❌ Hai un CONFLITO ao mesturar os cambios. PARA aquí e avisa antes de seguir."
  echo "   Se queres desfacer e quedar como antes:  git rebase --abort"
  exit 1
fi

# 4) Subir → dispara o auto-deploy de Cloudflare
echo "⬆  Subindo a GitHub (publicarase só en ~1 minuto)…"
git push

echo ""
echo "✅ Listo. Os cambios estarán en https://brais-e-diego.pages.dev nun minuto."
