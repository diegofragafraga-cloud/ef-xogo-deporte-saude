#!/bin/bash
# publicar.sh · re-despliega o espazo Brais e Diego a Cloudflare Pages
# Uso: cd ~/si/educacion && ./publicar.sh

set -e
cd "$(dirname "$0")"

echo "📤 Subindo a Cloudflare Pages..."
npx wrangler@latest pages deploy . --project-name=brais-e-diego --commit-dirty=true

echo ""
echo "✅ Listo. URL estable: https://brais-e-diego.pages.dev"
