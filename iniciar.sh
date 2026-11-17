#!/usr/bin/env bash
# ==============================================================================
# PasaYa - Script de inicio para macOS y Linux
# Laboratorio 13: Diseño del Modelo de Datos y Comunicación Full Stack
# ==============================================================================

cd "$(dirname "$0")"

echo "=============================================================================="
echo "            SISTEMA PASAYA - TRANSPORTE URBANO ELECTRONICO"
echo "      Laboratorio 13: Diseño del Modelo de Datos y Comunicación Full Stack"
echo "=============================================================================="
echo ""

# Validar que Node.js este instalado
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js no esta instalado en este equipo."
    echo "Descárgalo gratis desde: https://nodejs.org/ (Versión LTS recomendada)"
    exit 1
fi

echo "[*] Node.js detectado: $(node -v)"
echo "[1/2] Iniciando Servidor API Mock (json-server) en http://localhost:3000 ..."

# Iniciar json-server en segundo plano
npx --yes json-server --watch mock-api/db.json --port 3000 &
SERVER_PID=$!

echo "[2/2] Esperando inicialización del servidor..."
sleep 3

echo ""
echo "=============================================================================="
echo "   SISTEMA PASAYA LISTO Y EN EJECUCION"
echo "   - Interfaz Web:  frontend/index.html"
echo "   - Servidor API:  http://localhost:3000"
echo "=============================================================================="
echo ""

# Abrir en el navegador predeterminado
if command -v xdg-open &> /dev/null; then
    xdg-open frontend/index.html &> /dev/null &
elif command -v open &> /dev/null; then
    open frontend/index.html &> /dev/null &
fi

echo "Presiona Ctrl+C para detener el servidor API Mock."
wait $SERVER_PID
