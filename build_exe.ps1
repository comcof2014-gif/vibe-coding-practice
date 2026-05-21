$ErrorActionPreference = "Stop"

py -m pip install --upgrade pip
py -m pip install -r requirements.txt pyinstaller

py -m PyInstaller `
  --clean `
  --noconfirm `
  dealer-dashboard.spec

Write-Host ""
Write-Host "Build complete: dist\dealer-dashboard.exe"
Write-Host "The SmolLM2 GGUF model is not bundled into the EXE. It is downloaded on first run to AppData\dealer-dashboard-ai."
