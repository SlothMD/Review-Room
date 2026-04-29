@echo off
setlocal

set "OLLAMA_ORIGINS_VALUE=chrome-extension://*,moz-extension://*,safari-web-extension://*"

echo Setting user OLLAMA_ORIGINS to %OLLAMA_ORIGINS_VALUE%
setx OLLAMA_ORIGINS "%OLLAMA_ORIGINS_VALUE%" >nul
if errorlevel 1 (
  echo Failed to set OLLAMA_ORIGINS.
  exit /b 1
)

echo Stopping running Ollama processes, if any...
taskkill /IM ollama.exe /F >nul 2>nul
taskkill /IM "ollama app.exe" /F >nul 2>nul
ping 127.0.0.1 -n 3 >nul

echo Starting Ollama with extension origin support...
set "OLLAMA_ORIGINS=%OLLAMA_ORIGINS_VALUE%"
where ollama >nul 2>nul
if errorlevel 1 (
  echo Could not find ollama.exe on PATH.
  echo Install Ollama or start it manually after setting OLLAMA_ORIGINS.
  exit /b 1
)

start "Ollama Server" /MIN ollama serve

echo.
echo Waiting for Ollama to accept browser extension origins...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3; try { $r = Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -Headers @{ Origin = 'chrome-extension://review-author-test' } -UseBasicParsing -TimeoutSec 10; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
  echo Ollama started, but the browser extension origin check still failed.
  echo If Windows denied process termination, quit Ollama from the taskbar tray or run this script as administrator.
  echo The extension also includes a localhost Origin rewrite rule; reload it in chrome://extensions before testing.
  exit /b 1
)

echo Ollama restarted and accepted the browser extension origin test.
echo Reload the Review Author extension and refresh the Amazon product page before testing.

endlocal
