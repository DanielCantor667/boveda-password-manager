#!/bin/bash
# Bóveda — Build script (legacy wrapper)
# Ahora delega en electron-builder. Usa directamente:
#   npm run build:mac   → macOS DMG
#   npm run build:win   → Windows NSIS installer
#   npm run build:linux → Linux AppImage + deb
#   npm run build:all   → Todos los targets

set -euo pipefail

echo "============================================"
echo "  Bóveda - Build System"
echo "============================================"
echo ""
echo "Usando electron-builder..."
echo ""
echo "Plataformas disponibles:"
echo "  npm run build:mac    → macOS DMG"
echo "  npm run build:win    → Windows NSIS"
echo "  npm run build:linux  → Linux AppImage + deb"
echo "  npm run build:all    → Todas las plataformas"
echo ""

npx electron-builder "$@"
