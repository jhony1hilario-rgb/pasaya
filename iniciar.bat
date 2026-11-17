@echo off
chcp 65001 >nul
title PasaYa - Sistema de Transporte Urbano

:: 1. Asegurar que el directorio de trabajo sea la carpeta raiz del proyecto
cd /d "%~dp0"

echo ==============================================================================
echo             SISTEMA PASAYA - TRANSPORTE URBANO ELECTRONICO
echo       Laboratorio 13: Diseno del Modelo de Datos y Comunicacion Full Stack
echo ==============================================================================
echo.

:: 2. Validar que Node.js este instalado en el sistema
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado o no se encuentra en el PATH del sistema.
    echo.
    echo Para ejecutar la API simulada (json-server), se requiere tener Node.js instalado.
    echo.
    echo   1. Descargalo gratis desde: https://nodejs.org/ (Version recomendada: LTS)
    echo   2. Instala Node.js con las opciones por defecto.
    echo   3. Vuelve a hacer doble clic sobre 'iniciar.bat'.
    echo.
    echo ==============================================================================
    echo.
    pause
    exit /b 1
)

:: Mostrar version de Node.js detectada
for /f "tokens=*" %%i in ('node -v 2^>nul') do set NODE_VERSION=%%i
echo [*] Node.js detectado: %NODE_VERSION%

:: 3. Verificar la existencia de los archivos clave del proyecto
if not exist "mock-api\db.json" (
    echo [ERROR] No se encontro el archivo de base de datos 'mock-api\db.json'.
    echo Asegurate de haber descomprimido el contenido completo del proyecto.
    echo.
    pause
    exit /b 1
)

if not exist "frontend\index.html" (
    echo [ERROR] No se encontro el archivo 'frontend\index.html'.
    echo Asegurate de haber descomprimido el contenido completo del proyecto.
    echo.
    pause
    exit /b 1
)

echo [*] Archivos del proyecto verificados exitosamente.
echo.

:: 4. Levantar servidor API Mock en una ventana secundaria de terminal
echo [1/2] Iniciando Servidor API Mock (json-server) en http://localhost:3000 ...
echo       Base de datos: mock-api\db.json
echo.
start "PasaYa - Servidor API Mock (:3000)" cmd /k "chcp 65001 >nul && title PasaYa - Consola API Mock && echo ================================================================ && echo   PASAYA - SERVIDOR API REST MOCK ACTIVO EN PUERTO 3000 && echo   Visualiza aqui las peticiones HTTP (GET, POST, PATCH, etc.) && echo   Presiona Ctrl+C en cualquier momento para detener este servidor. && echo ================================================================ && echo. && npx --yes json-server --watch mock-api/db.json --port 3000"

:: 5. Esperar 3 segundos para que el servidor complete el enlace al puerto 3000
echo [2/2] Esperando inicializacion del servidor...
timeout /t 3 /nobreak >nul 2>nul || ping 127.0.0.1 -n 4 >nul

:: 6. Abrir la interfaz web en el navegador predeterminado
echo.
echo ==============================================================================
echo    SISTEMA PASAYA LISTO Y EN EJECUCION
echo ==============================================================================
echo.
echo   - Interfaz Web:  frontend\index.html (Abriendo en tu navegador...)
echo   - Servidor API:  http://localhost:3000
echo.
echo NOTA: Manten abierta la ventana 'PasaYa - Consola API Mock' mientras
echo       utilices el sistema para permitir la comunicacion con el backend.
echo ==============================================================================
echo.

start "" "%~dp0frontend\index.html"

echo Presiona cualquier tecla para cerrar esta ventana informativa...
pause >nul
exit /b 0
