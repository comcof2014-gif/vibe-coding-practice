$ErrorActionPreference = "Stop"

$env:CMAKE_ARGS = "-DGGML_NATIVE=OFF -DLLAMA_NATIVE=OFF -DGGML_AVX=OFF -DGGML_AVX2=OFF -DGGML_FMA=OFF -DGGML_F16C=OFF"
$env:FORCE_CMAKE = "1"

py -m pip install --upgrade pip setuptools wheel cmake ninja
py -m pip install --no-binary llama-cpp-python --upgrade --force-reinstall --no-cache-dir -r requirements.txt pyinstaller

py -m PyInstaller `
  --clean `
  --noconfirm `
  dealer-dashboard.spec

Write-Host ""
Write-Host "Build complete: dist\dealer-dashboard.exe"
Write-Host "The SmolLM2 GGUF model is not bundled into the EXE. It is downloaded on first run to AppData\dealer-dashboard-ai."
