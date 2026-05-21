# dealer-dashboard EXE 빌드

## 빌드 명령

PowerShell에서 저장소 루트로 이동한 뒤 실행합니다.

```powershell
.\build_exe.ps1
```

동일한 설정을 직접 실행하려면 아래 명령을 사용합니다.

```powershell
py -m pip install -r requirements.txt pyinstaller
py -m PyInstaller --clean --noconfirm dealer-dashboard.spec
```

## 로컬 AI 모델

- 추천 모델: `QuantFactory/SmolLM2-135M-Instruct-GGUF`
- 사용 파일: `SmolLM2-135M-Instruct.Q4_K_M.gguf`
- 크기: 약 105MB
- 라이선스: Apache 2.0 계열
- 런타임: `llama-cpp-python`

첫 실행 시 모델은 EXE 내부가 아니라 사용자의 영구 저장소인 `%APPDATA%\dealer-dashboard-ai\`에 다운로드됩니다. 이미 파일이 있으면 다시 받지 않습니다.

## 포함/제외 원칙

- `torch`, `transformers`는 사용하지 않습니다.
- `onnxruntime`, `tokenizers`, `numpy` 기반 추천 엔진은 제거했습니다.
- 로컬 AI는 프롬프트를 고르는 용도가 아니라, 현재 선택한 프롬프트의 오른쪽 예시 결과 화면을 직접 작성하는 용도입니다.
- 모델 파일은 EXE에 포함하지 않습니다. PyInstaller `--onefile` 임시 폴더(`sys._MEIPASS`)에 저장하면 앱 종료 시 삭제될 수 있기 때문입니다.

## 다운로드 위치

앱은 아래 파일을 다운로드합니다.

- `https://huggingface.co/QuantFactory/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct.Q4_K_M.gguf?download=true`

모델 크기가 200MB를 넘으면 초기화 단계에서 오류로 표시되도록 방어 로직을 두었습니다.
