$ErrorActionPreference = "Stop"

py -m pip install --upgrade pip setuptools wheel
py -m pip install --upgrade --force-reinstall --no-cache-dir -r requirements.txt pyinstaller

py -m PyInstaller `
  --clean `
  --noconfirm `
  dealer-dashboard.spec

Write-Host ""
Write-Host "Build complete: dist\dealer-dashboard.exe"
Write-Host "Online AI uses Gemini API. Save a free Gemini API key in the app after first launch."
