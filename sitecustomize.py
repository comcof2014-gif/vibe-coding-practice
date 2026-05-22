from __future__ import annotations

import builtins
import json
import os
import sys
import threading
from pathlib import Path
from typing import Any


DEFAULT_MODEL = "gemini-2.5-flash-lite"
QUALITY_MODEL = "gemini-2.5-flash"
SUPPORTED_MODELS = [
    {"id": DEFAULT_MODEL, "label": "Gemini 2.5 Flash-Lite (fast/free-friendly)"},
    {"id": QUALITY_MODEL, "label": "Gemini 2.5 Flash (higher quality)"},
]


def _data_dir() -> Path:
    override = os.environ.get("DEALER_DASHBOARD_CONFIG_DIR")
    if override:
        base = Path(override)
    elif getattr(sys, "frozen", False):
        base = Path(sys.executable).resolve().parent / "dealer-dashboard-data"
    else:
        base = Path(__file__).resolve().parent / "dealer-dashboard-data"
    base.mkdir(parents=True, exist_ok=True)
    return base


def _settings_path() -> Path:
    return _data_dir() / "ai-settings.json"


class GeminiAIManager:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._settings = self._load_settings()
        self._status = self._build_status()

    def _load_settings(self) -> dict[str, str]:
        data: dict[str, str] = {}
        path = _settings_path()
        if path.exists():
            try:
                raw = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(raw, dict):
                    data = {str(k): str(v) for k, v in raw.items() if v is not None}
            except (OSError, json.JSONDecodeError):
                data = {}
        if os.environ.get("GEMINI_API_KEY"):
            data["api_key"] = os.environ["GEMINI_API_KEY"].strip()
        data["model"] = (os.environ.get("DEALER_DASHBOARD_AI_MODEL") or data.get("model") or DEFAULT_MODEL).strip()
        if data["model"] not in {m["id"] for m in SUPPORTED_MODELS}:
            data["model"] = DEFAULT_MODEL
        return data

    def _save_settings(self) -> None:
        path = _settings_path()
        path.write_text(json.dumps(self._settings, ensure_ascii=False, indent=2), encoding="utf-8")

    def _api_key(self) -> str:
        return (os.environ.get("GEMINI_API_KEY") or self._settings.get("api_key") or "").strip()

    def _model(self) -> str:
        return (os.environ.get("DEALER_DASHBOARD_AI_MODEL") or self._settings.get("model") or DEFAULT_MODEL).strip()

    def _build_status(self, error: str | None = None) -> dict[str, Any]:
        ready = bool(self._api_key())
        if error:
            state = "error"
            phase = error
        elif ready:
            state = "ready"
            phase = "Gemini 온라인 AI 준비 완료"
        else:
            state = "needs_api_key"
            phase = "Gemini API 키를 저장하면 온라인 AI를 사용할 수 있습니다."
        return {
            "state": state,
            "ready": ready,
            "progress": 100 if ready else 0,
            "phase": phase,
            "error": error,
            "runtime": "google-gemini-api",
            "mode": "online-generative",
            "provider": "Google Gemini API",
            "model": self._model(),
            "settings_path": str(_settings_path()),
        }

    def status(self) -> dict[str, Any]:
        with self._lock:
            self._status = self._build_status(self._status.get("error"))
            return dict(self._status)

    def start_async(self, progress_callback=None) -> dict[str, Any]:
        return self.status()

    def public_settings(self) -> dict[str, Any]:
        with self._lock:
            return {
                "provider": "Google Gemini API",
                "model": self._model(),
                "api_key_present": bool(self._api_key()),
                "settings_path": str(_settings_path()),
                "supported_models": SUPPORTED_MODELS,
            }

    def configure(self, api_key: str = "", model: str = "", clear_api_key: bool = False) -> dict[str, Any]:
        with self._lock:
            if clear_api_key:
                self._settings.pop("api_key", None)
            elif api_key.strip():
                self._settings["api_key"] = api_key.strip()
            if model.strip():
                self._settings["model"] = model.strip()
            if self._settings.get("model") not in {m["id"] for m in SUPPORTED_MODELS}:
                self._settings["model"] = DEFAULT_MODEL
            self._save_settings()
            self._status = self._build_status(None)
            return self.public_settings()

    def match(self, text: str, top_k: int = 3) -> dict[str, Any]:
        return self.run_prompt(
            prompt_id="freeform",
            title="사용자 요청",
            prompt_text="아래 요청을 대리점 실무자가 바로 실행할 수 있는 한국어 결과물로 작성해줘.",
            inputs={"요청": text},
            extra_request="",
        )

    def preview_demo(self, **payload) -> dict[str, Any]:
        return self._fallback("Gemini API 키가 없어 기본 예시를 표시합니다.", payload)

    def compose_demo(self, **payload) -> dict[str, Any]:
        title = payload.get("title") or "프롬프트"
        sections = ", ".join(payload.get("output_sections") or []) or "실행안, 예시 문구, 체크리스트"
        base = (
            f"'{title}' 프롬프트의 실제 결과 예시를 작성해줘. "
            f"필요 섹션: {sections}. 대리점 현장에서 바로 쓸 수 있게 한국어로 구체적으로 써줘."
        )
        return self.run_prompt(
            prompt_id=payload.get("prompt_id", ""),
            title=title,
            prompt_text=base,
            inputs=payload.get("inputs") or {},
            extra_request=payload.get("extra_request", ""),
        )

    def improve_prompt(
        self,
        prompt_id: str = "",
        title: str = "",
        summary: str = "",
        base_prompt: str = "",
        inputs: dict[str, Any] | None = None,
        extra_request: str = "",
    ) -> dict[str, Any]:
        request = f"""
You are improving a prompt for a Korean boiler/dealer dashboard.
Return only the improved prompt body. Do not explain.

Prompt title: {title}
Prompt purpose: {summary}
Current field inputs:
{self._format_inputs(inputs or {})}

Additional user request:
{extra_request or "없음"}

Current prompt:
{base_prompt}

Requirements:
- Keep the final prompt in English where it is already English, but force the deliverable to be Korean.
- Make the prompt react strongly to the current field inputs.
- Add concrete Korean dealer work details, measurable outputs, and no generic filler.
"""
        return self._generate(request, fallback_payload={
            "title": title,
            "base_prompt": base_prompt,
            "inputs": inputs or {},
            "extra_request": extra_request,
        })

    def run_prompt(
        self,
        prompt_id: str = "",
        title: str = "",
        prompt_text: str = "",
        inputs: dict[str, Any] | None = None,
        extra_request: str = "",
    ) -> dict[str, Any]:
        request = f"""
You are generating the final Korean output for a dealer-dashboard prompt.
Write around 600-900 Korean characters unless a table is clearly better.
Be specific, practical, and suitable for a Korean boiler/dealer store.

Prompt title: {title}
Current field inputs:
{self._format_inputs(inputs or {})}

Additional user request:
{extra_request or "없음"}

Prompt to apply:
{prompt_text}
"""
        return self._generate(request, fallback_payload={
            "title": title,
            "base_prompt": prompt_text,
            "inputs": inputs or {},
            "extra_request": extra_request,
        })

    def _generate(self, prompt: str, fallback_payload: dict[str, Any]) -> dict[str, Any]:
        key = self._api_key()
        if not key:
            raise RuntimeError("Gemini API 키를 저장한 뒤 온라인 AI를 사용할 수 있습니다.")
        try:
            import requests

            model = self._model()
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            res = requests.post(
                url,
                headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                json={
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.55,
                        "topP": 0.9,
                        "maxOutputTokens": 1400,
                    },
                },
                timeout=45,
            )
            res.raise_for_status()
            data = res.json()
            text = self._extract_text(data)
            if not text:
                raise RuntimeError("Gemini 응답에 텍스트가 없습니다.")
            return {"status": "ok", "provider": "Google Gemini API", "model": model, "text": text.strip()}
        except Exception as exc:
            return self._fallback(str(exc), fallback_payload)

    def _fallback(self, error: str, payload: dict[str, Any]) -> dict[str, Any]:
        title = payload.get("title") or "프롬프트"
        inputs = payload.get("inputs") or {}
        extra = payload.get("extra_request") or ""
        text = (
            f"{title}\n\n"
            f"현재 입력값을 기준으로 즉시 실행 가능한 형태로 보강합니다.\n"
            f"{self._format_inputs(inputs)}\n\n"
            f"추가 요청: {extra or '없음'}\n\n"
            "1. 고객을 상황별로 나누고, 각 그룹마다 첫 문장과 후속 연락 기준을 다르게 둡니다.\n"
            "2. 결과물에는 알림톡 문구, 전화 대본, 담당자 체크리스트, 다음 행동 기준을 반드시 포함합니다.\n"
            "3. 막연한 표현 대신 지역명, 고객층, 최근 이슈, 응답률 같은 입력값을 본문에 직접 반영합니다."
        )
        return {"status": "fallback", "provider": "Google Gemini API", "model": self._model(), "text": text, "error": error}

    @staticmethod
    def _extract_text(data: dict[str, Any]) -> str:
        parts: list[str] = []
        for cand in data.get("candidates") or []:
            for part in ((cand.get("content") or {}).get("parts") or []):
                if isinstance(part.get("text"), str):
                    parts.append(part["text"])
        return "\n".join(parts)

    @staticmethod
    def _format_inputs(inputs: dict[str, Any]) -> str:
        if not inputs:
            return "- 입력값 없음"
        return "\n".join(f"- {key}: {value}" for key, value in inputs.items() if str(value).strip())


def _patch_ai_engine(module) -> None:
    if getattr(module, "__online_gemini_patch__", False):
        return
    module.__online_gemini_patch__ = True
    module.ai_manager = GeminiAIManager()
    module.MODEL_REPO = "Google Gemini API"
    module.MODEL_FILE = DEFAULT_MODEL
    module.MODEL_LICENSE = "Gemini API terms"
    module.MODEL_SIZE_LIMIT_BYTES = 0


def _route_exists(app, path: str, methods: set[str]) -> bool:
    for route in getattr(app, "routes", []):
        route_methods = set(getattr(route, "methods", []) or [])
        if getattr(route, "path", "") == path and methods <= route_methods:
            return True
    return False


def _patch_app(module) -> None:
    app = getattr(module, "app", None)
    ai_manager = getattr(sys.modules.get("ai_engine"), "ai_manager", None)
    if app is None or ai_manager is None or getattr(app.state, "online_gemini_patch", False):
        return
    app.state.online_gemini_patch = True
    from fastapi import Request

    if not _route_exists(app, "/api/ai/settings", {"GET"}):
        @app.get("/api/ai/settings")
        async def online_ai_settings_get():
            return ai_manager.public_settings()

    if not _route_exists(app, "/api/ai/settings", {"PUT"}):
        @app.put("/api/ai/settings")
        async def online_ai_settings_put(request: Request):
            payload = await request.json()
            settings = ai_manager.configure(
                api_key=str(payload.get("api_key") or ""),
                model=str(payload.get("model") or ""),
                clear_api_key=bool(payload.get("clear_api_key")),
            )
            return {"status": "ok", "settings": settings, "ai": ai_manager.status()}

    @app.middleware("http")
    async def online_ai_override_script(request, call_next):
        response = await call_next(request)
        content_type = response.headers.get("content-type", "")
        if request.url.path != "/" or "text/html" not in content_type:
            return response
        body = b""
        async for chunk in response.body_iterator:
            body += chunk
        text = body.decode("utf-8", errors="replace")
        script = '<script src="/static/online_ai_override.js"></script>'
        if script not in text:
            text = text.replace("</body>", f"    {script}\n</body>")
        from fastapi.responses import HTMLResponse

        return HTMLResponse(text, status_code=response.status_code)


_original_import = builtins.__import__


def _patched_import(name, globals=None, locals=None, fromlist=(), level=0):
    module = _original_import(name, globals, locals, fromlist, level)
    root = name.split(".", 1)[0]
    if root == "ai_engine" and "ai_engine" in sys.modules:
        _patch_ai_engine(sys.modules["ai_engine"])
    elif root == "app" and "app" in sys.modules:
        _patch_ai_engine(sys.modules["ai_engine"]) if "ai_engine" in sys.modules else None
        _patch_app(sys.modules["app"])
    return module


if not getattr(builtins, "__dealer_dashboard_online_import_patch__", False):
    builtins.__dealer_dashboard_online_import_patch__ = True
    builtins.__import__ = _patched_import
