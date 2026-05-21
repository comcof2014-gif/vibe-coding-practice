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

## 포함/제외 원칙

- `torch`, `transformers`는 사용하지 않습니다.
- 로컬 AI 런타임은 `onnxruntime`, `tokenizers`, `numpy`, `requests`만 사용합니다.
- `model_quantized.onnx`와 `tokenizer.json`은 EXE에 포함하지 않습니다.
- 첫 실행 시 모델 파일은 영구 저장소인 `%APPDATA%\dealer-dashboard-ai\`에 저장됩니다.
- 이미 파일이 있으면 다운로드를 건너뜁니다.

## 모델 다운로드 위치

앱은 아래 파일을 사용합니다.

- `https://huggingface.co/Xenova/bge-small-en-v1.5/resolve/main/onnx/model_quantized.onnx`
- `https://huggingface.co/Xenova/bge-small-en-v1.5/resolve/main/tokenizer.json`

PyInstaller `--onefile`의 임시 폴더(`sys._MEIPASS`)에는 모델을 저장하지 않습니다.
