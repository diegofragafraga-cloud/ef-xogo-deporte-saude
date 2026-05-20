#!/bin/bash
# publicar.sh · re-despliega o espazo Brais e Diego a Cloudflare Pages
# Uso: cd ~/si/educacion && ./publicar.sh

set -e
cd "$(dirname "$0")"

# Fixar a conta CF onde vive brais-e-diego (Diegofragafraga@gmail.com's Account).
# Evita o erro "More than one account available" cando wrangler ve varias contas.
export CLOUDFLARE_ACCOUNT_ID=a7df9fa2a9867268d5813d753b527ceb

echo "📤 Subindo a Cloudflare Pages..."
npx wrangler@latest pages deploy . --project-name=brais-e-diego --commit-dirty=true

echo ""
echo "✅ Listo. URL estable: https://brais-e-diego.pages.dev"
