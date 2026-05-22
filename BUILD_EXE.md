# dealer-dashboard EXE 빌드

## 빌드 명령

PowerShell에서 저장소 루트로 이동한 뒤 실행합니다.

```powershell
.\build_exe.ps1
```

직접 실행하려면 아래 흐름을 사용합니다.

```powershell
py -m pip install --upgrade pip setuptools wheel
py -m pip install --upgrade --force-reinstall --no-cache-dir -r requirements.txt pyinstaller
py -m PyInstaller --clean --noconfirm dealer-dashboard.spec
```

## 온라인 AI 모델

이 버전은 무거운 로컬 모델 다운로드와 `llama-cpp-python` 빌드를 제거하고, 온라인 Gemini API를 사용합니다.

- 기본 모델: `gemini-2.5-flash-lite`
- 품질 우선 선택 모델: `gemini-2.5-flash`
- 제공자: Google Gemini API
- API 키 저장 위치: EXE 옆 `dealer-dashboard-data/ai-settings.json`
- 앱 데이터 저장 위치: EXE 옆 `dealer-dashboard-data/config.json`

첫 실행 후 앱의 `AI 프롬프트 스튜디오`에서 Google AI Studio의 무료 Gemini API 키를 저장하면 바로 사용할 수 있습니다. 인터넷이 없거나 API 키가 없으면 AI 생성 버튼은 대기 상태로 남고, 임의 결과를 만들지 않습니다.

## 포함/제외 원칙

- `torch`, `transformers`, `llama-cpp-python`은 사용하지 않습니다.
- 별도 GGUF 모델 파일을 EXE에 포함하지 않습니다.
- EXE 빌드 시간이 기존 로컬 모델 버전보다 짧아집니다.
