# dealer-dashboard EXE 빌드

## 빌드 명령

PowerShell에서 저장소 루트로 이동한 뒤 실행합니다.

```powershell
.\build_exe.ps1
```

동일한 설정을 직접 실행하려면 아래 흐름을 사용합니다.

```powershell
$env:CMAKE_ARGS = "-DGGML_NATIVE=OFF -DLLAMA_NATIVE=OFF -DGGML_AVX=OFF -DGGML_AVX2=OFF -DGGML_FMA=OFF -DGGML_F16C=OFF"
$env:FORCE_CMAKE = "1"
py -m pip install --upgrade pip setuptools wheel cmake ninja
py -m pip install --no-binary llama-cpp-python --upgrade --force-reinstall --no-cache-dir -r requirements.txt pyinstaller
py -m PyInstaller --clean --noconfirm dealer-dashboard.spec
```

`0xc000001d` 오류가 나는 PC를 줄이기 위해 `llama-cpp-python`은 사전 빌드 휠 대신 보수적인 CPU 옵션으로 다시 빌드합니다. 그래서 첫 EXE 빌드는 기존보다 오래 걸릴 수 있습니다.

## 로컬 AI 모델

- 추천 모델: `QuantFactory/SmolLM2-135M-Instruct-GGUF`
- 사용 파일: `SmolLM2-135M-Instruct.Q4_K_M.gguf`
- 크기: 약 105MB
- 라이선스: Apache 2.0 계열
- 실행 엔진: `llama-cpp-python`

첫 실행 때 모델은 EXE 내부가 아니라 사용자의 영구 저장소 `%APPDATA%\dealer-dashboard-ai\`에 다운로드됩니다. 이미 파일이 있으면 다시 받지 않습니다.

## 포함/제외 원칙

- `torch`, `transformers`는 사용하지 않습니다.
- 모델 파일은 EXE에 포함하지 않습니다. PyInstaller `--onefile` 임시 폴더(`sys._MEIPASS`)에 저장하면 앱 종료 뒤 삭제될 수 있기 때문입니다.
- 로컬 AI는 프롬프트를 고르는 기능이 아니라, 현재 선택한 프롬프트와 입력값을 바탕으로 오른쪽 예시 결과를 직접 작성하는 용도입니다.

## 다운로드 위치

앱은 아래 파일을 필요할 때 다운로드합니다.

- `https://huggingface.co/QuantFactory/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct.Q4_K_M.gguf?download=true`

모델 크기가 200MB를 넘으면 초기화 단계에서 오류로 표시되도록 방어 로직이 들어 있습니다.
