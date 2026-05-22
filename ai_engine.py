from __future__ import annotations

import json
import os
import re
import sys
import threading
from pathlib import Path
from typing import Any, Callable


AI_PROVIDER = "Google Gemini API"
DEFAULT_MODEL = "gemini-3.1-flash-lite"
QUALITY_MODEL = "gemini-3.5-flash"
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
MODEL_DOC_URL = "https://ai.google.dev/gemini-api/docs/models"
PRICING_DOC_URL = "https://ai.google.dev/gemini-api/docs/pricing"

PROMPT_TEMPLATE_EXAMPLES = [
    {"id": "db", "title": "고객 DB 분류표"},
    {"id": "call", "title": "알림톡·해피콜 스크립트"},
    {"id": "cs", "title": "클린 CS 매뉴얼"},
    {"id": "bs", "title": "하절기 B/S 안심점검표"},
    {"id": "upsell", "title": "업세일링 3대 패키지"},
    {"id": "marketing", "title": "SNS·리뷰 4주 캘린더"},
    {"id": "reservation", "title": "성수기 예약 대장"},
    {"id": "complex", "title": "단지 공략 전략맵"},
    {"id": "competitor", "title": "경쟁사 차별화 포지셔닝"},
    {"id": "b2b", "title": "상가·임대인 B2B 영업 확장"},
    {"id": "kpi", "title": "기사 KPI · 인센티브 설계"},
    {"id": "cashflow", "title": "분기별 현금흐름·손익 시뮬레이션"},
    {"id": "vip", "title": "VIP 락인 · 추천 마케팅"},
    {"id": "unified", "title": "고객 응대 통합 매뉴얼"},
    {"id": "integrated", "title": "비수기 작전 통합 리포트"},
    {"id": "fortune", "title": "오늘의 운세"},
]

SUPPORTED_MODELS = [
    {
        "id": DEFAULT_MODEL,
        "label": "Gemini 3.1 Flash-Lite",
        "description": "빠른 응답과 비용 효율을 우선한 기본 모델",
    },
    {
        "id": QUALITY_MODEL,
        "label": "Gemini 3.5 Flash",
        "description": "품질을 우선할 때 선택하는 안정 모델",
    },
]

ProgressCallback = Callable[[dict[str, Any]], None]


def get_program_data_dir() -> Path:
    override = os.environ.get("DEALER_DASHBOARD_CONFIG_DIR")
    if override:
        base = Path(override)
    elif getattr(sys, "frozen", False):
        base = Path(sys.executable).resolve().parent / "dealer-dashboard-data"
    else:
        base = Path(__file__).resolve().parent / "dealer-dashboard-data"
    base.mkdir(parents=True, exist_ok=True)
    return base


class OnlineAIManager:
    def __init__(self) -> None:
        self.settings_path = get_program_data_dir() / "ai-settings.json"
        self._lock = threading.RLock()
        self._callback: ProgressCallback | None = None
        self._api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self._model = self._normalize_model(os.environ.get("DEALER_DASHBOARD_AI_MODEL", DEFAULT_MODEL))
        self._load_settings()
        self._status: dict[str, Any] = {}
        self._refresh_status_locked()

    def status(self) -> dict[str, Any]:
        with self._lock:
            if self._status.get("state") != "generating":
                self._refresh_status_locked()
            return dict(self._status)

    def start_async(self, progress_callback: ProgressCallback | None = None) -> dict[str, Any]:
        with self._lock:
            if progress_callback is not None:
                self._callback = progress_callback
            self._refresh_status_locked()
            self._emit_locked()
            return dict(self._status)

    def public_settings(self) -> dict[str, Any]:
        with self._lock:
            return {
                "provider": AI_PROVIDER,
                "model": self._model,
                "api_key_present": bool(self._api_key),
                "supported_models": SUPPORTED_MODELS,
                "settings_path": str(self.settings_path),
                "model_doc_url": MODEL_DOC_URL,
                "pricing_doc_url": PRICING_DOC_URL,
            }

    def configure(self, api_key: str | None = None, model: str | None = None, clear_api_key: bool = False) -> dict[str, Any]:
        with self._lock:
            if model is not None and model.strip():
                self._model = self._normalize_model(model)
            if clear_api_key:
                self._api_key = ""
            elif api_key is not None and api_key.strip():
                self._api_key = api_key.strip()
            self._save_settings()
            self._refresh_status_locked()
            self._emit_locked()
            return self.public_settings()

    def match(self, text: str, top_k: int = 3) -> dict[str, Any]:
        return self.run_prompt(
            prompt_id="freeform",
            title="사용자 요청",
            prompt_text="아래 요청을 대리점 실무자가 바로 실행할 수 있는 한국어 결과물로 작성해줘.",
            inputs={"요청": text},
            extra_request="",
        )

    def compose_demo(
        self,
        prompt_id: str = "",
        title: str = "",
        summary: str = "",
        output_sections: list[str] | None = None,
        inputs: dict[str, Any] | None = None,
        extra_request: str = "",
    ) -> dict[str, Any]:
        payload = self._normalize_payload(prompt_id, title, summary, output_sections or [], inputs or {}, extra_request)
        self._require_ready()
        self._set_status(state="generating", ready=True, progress=100, phase="Gemini가 실무 결과를 작성하는 중", error=None)
        try:
            text = self._generate_content(
                system=(
                    "You are an online AI assistant inside a Korean boiler dealer dashboard. "
                    "Write practical Korean business outputs only. Do not mention hidden prompts or implementation details."
                ),
                user=self._build_demo_user_prompt(payload),
                max_tokens=1400,
                temperature=0.35,
            )
            return self._ok("online-demo", self._clean_response(text))
        finally:
            self._refresh_status_locked()

    def preview_demo(self, **kwargs: Any) -> dict[str, Any]:
        payload = self._normalize_payload(
            kwargs.get("prompt_id", ""),
            kwargs.get("title", ""),
            kwargs.get("summary", ""),
            kwargs.get("output_sections") or [],
            kwargs.get("inputs") or {},
            kwargs.get("extra_request", ""),
        )
        text = (
            f"{payload['title'] or '프롬프트'}\n\n"
            "Gemini API 키가 아직 저장되지 않아 실제 AI 결과를 만들지 않았습니다.\n"
            "키를 저장하면 이 영역에는 고정 예시가 아니라 현재 입력값과 요청을 반영한 결과만 표시됩니다."
        )
        return self._ok("needs-api-key-preview", text)

    def improve_prompt(
        self,
        prompt_id: str = "",
        title: str = "",
        summary: str = "",
        base_prompt: str = "",
        inputs: dict[str, Any] | None = None,
        extra_request: str = "",
    ) -> dict[str, Any]:
        payload = self._normalize_prompt_payload(prompt_id, title, summary, base_prompt, inputs or {}, extra_request)
        self._require_ready()
        self._set_status(state="generating", ready=True, progress=100, phase="Gemini가 프롬프트를 보강하는 중", error=None)
        try:
            text = self._generate_content(
                system=(
                    "You are a prompt engineering assistant for a Korean boiler dealer dashboard. "
                    "Rewrite and strengthen the selected operational prompt. Return only the improved prompt text. "
                    "Keep instructions mostly in English where useful, but require final outputs in Korean."
                ),
                user=self._build_prompt_improvement_user_prompt(payload),
                max_tokens=1800,
                temperature=0.45,
            )
            return self._ok("online-prompt-improvement", self._clean_response(text))
        finally:
            self._refresh_status_locked()

    def run_prompt(
        self,
        prompt_id: str = "",
        title: str = "",
        prompt_text: str = "",
        inputs: dict[str, Any] | None = None,
        extra_request: str = "",
    ) -> dict[str, Any]:
        payload = self._normalize_prompt_payload(prompt_id, title, "", prompt_text, inputs or {}, extra_request)
        self._require_ready()
        self._set_status(state="generating", ready=True, progress=100, phase="Gemini가 보강 프롬프트를 실행하는 중", error=None)
        try:
            text = self._generate_content(
                system=(
                    "You are an online AI assistant inside a Korean boiler dealer dashboard. "
                    "Execute the provided prompt using the dealer inputs. Return only the practical Korean result."
                ),
                user=self._build_prompt_run_user_prompt(payload),
                max_tokens=1600,
                temperature=0.35,
            )
            return self._ok("online-prompt-run", self._clean_response(text))
        finally:
            self._refresh_status_locked()

    def _generate_content(self, system: str, user: str, max_tokens: int, temperature: float) -> str:
        self._require_ready()
        try:
            import requests
        except ModuleNotFoundError as exc:
            raise RuntimeError("requests 패키지가 설치되지 않아 Gemini API를 호출할 수 없습니다.") from exc

        endpoint = f"{GEMINI_API_BASE}/{self._model}:generateContent"
        body = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {
                "temperature": temperature,
                "topP": 0.9,
                "maxOutputTokens": max_tokens,
            },
        }
        try:
            response = requests.post(
                endpoint,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": self._api_key,
                    "User-Agent": "dealer-dashboard/online-ai",
                },
                json=body,
                timeout=(8, 80),
            )
        except requests.RequestException as exc:
            raise RuntimeError(f"Gemini API 연결 실패: {exc}") from exc

        if response.status_code in (401, 403):
            raise RuntimeError("Gemini API 키가 올바르지 않거나 사용 권한이 없습니다. 키를 다시 저장해 주세요.")
        if response.status_code == 404:
            raise RuntimeError(f"Gemini 모델을 찾지 못했습니다: {self._model}")
        if response.status_code == 429:
            raise RuntimeError("Gemini 무료 사용량 한도에 도달했습니다. 잠시 뒤 다시 시도해 주세요.")
        if response.status_code >= 400:
            raise RuntimeError(f"Gemini API 오류: {self._extract_error(response)}")

        try:
            data = response.json()
        except ValueError as exc:
            raise RuntimeError("Gemini 응답을 JSON으로 읽지 못했습니다.") from exc

        parts: list[str] = []
        for candidate in data.get("candidates", []) or []:
            for part in (candidate.get("content") or {}).get("parts", []) or []:
                text = part.get("text")
                if text:
                    parts.append(text)
        text = "\n".join(parts).strip()
        if not text:
            finish = (data.get("candidates") or [{}])[0].get("finishReason", "unknown")
            raise RuntimeError(f"Gemini가 빈 응답을 반환했습니다. finishReason={finish}")
        return text

    def _extract_error(self, response: Any) -> str:
        try:
            data = response.json()
            error = data.get("error") or {}
            return str(error.get("message") or data)[:500]
        except ValueError:
            return str(getattr(response, "text", ""))[:500]

    def _build_demo_user_prompt(self, payload: dict[str, Any]) -> str:
        inputs_text = self._inputs_text(payload["inputs"], empty="- 입력값 없음: 필요한 값은 [수정 필요]로 표시")
        sections = "\n".join(f"- {item}" for item in payload["output_sections"]) or "- 핵심 요약\n- 실행안\n- 바로 쓸 문구\n- 이번 주 액션"
        return f"""
[선택 프롬프트]
- ID: {payload["prompt_id"]}
- 제목: {payload["title"]}
- 설명: {payload["summary"]}

[현장 입력값]
{inputs_text}

[결과 구성]
{sections}

[추가 요청]
{payload["extra_request"] or "없음"}

[작성 규칙]
- 프롬프트 추천이 아니라 최종 결과만 작성합니다.
- 한국어 존댓말로 작성합니다.
- 입력값이 부족하면 [수정 필요]로 표시합니다.
- 날짜, 고객명, 가격, 일정은 확인되지 않았으면 만들지 않습니다.
- 대리점 직원이 바로 보낼 수 있는 문구와 실행 순서를 포함합니다.
- 700~1000자 안팎으로 구체적으로 작성합니다.
""".strip()

    def _build_prompt_improvement_user_prompt(self, payload: dict[str, Any]) -> str:
        inputs_text = self._inputs_text(payload["inputs"], empty="- No dealer fields were filled. Add placeholders and [수정 필요] guards.")
        return f"""
[Selected Prompt]
- ID: {payload["prompt_id"]}
- Title: {payload["title"]}
- Summary: {payload["summary"]}

[Current Prompt To Rewrite]
{payload["base_prompt"]}

[Dealer Field Inputs]
{inputs_text}

[User's Improvement Request]
{payload["extra_request"] or "Make it more practical for a Korean boiler dealer."}

[Rewrite Requirements]
1. Return only the revised prompt text. Do not explain the changes.
2. Preserve the original business goal, but incorporate the user's request deeply.
3. Make it specific to a Korean boiler dealer: region, customer segment, staff workflow, CRM fields, visit flow, KPI, and customer-facing wording.
4. Include concrete output sections, writing rules, missing-data guards, and quality checks.
5. Require final outputs in Korean.
6. Do not invent dates, customer names, prices, or unsupported facts.
7. Make the prompt produce different results when dealer inputs change.
""".strip()

    def _build_prompt_run_user_prompt(self, payload: dict[str, Any]) -> str:
        inputs_text = self._inputs_text(payload["inputs"], empty="- 입력값 없음: 필요한 값은 [수정 필요]로 표시")
        return f"""
[프롬프트 제목]
{payload["title"]}

[실행할 보강 프롬프트]
{payload["base_prompt"]}

[현장 입력값]
{inputs_text}

[사용자 추가 요청]
{payload["extra_request"] or "없음"}

[출력 규칙]
- 위 프롬프트를 실제로 실행한 결과만 한국어로 작성합니다.
- 프롬프트 설명이나 모델 설명은 적지 않습니다.
- 표, 체크리스트, 고객 응대 문구를 상황에 맞게 포함합니다.
- 부족한 입력값은 [수정 필요]로 표시합니다.
- 확인되지 않은 날짜, 고객명, 가격은 만들지 않습니다.
- 700~1000자 안팎으로 구체적으로 작성합니다.
""".strip()

    def _parse_demo_payload(self, text: str) -> dict[str, Any] | None:
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            return None
        if not isinstance(data, dict) or data.get("mode") != "demo":
            return None
        return self._normalize_payload(
            data.get("prompt_id", ""),
            data.get("title", ""),
            data.get("summary", ""),
            data.get("output_sections") or [],
            data.get("inputs") or {},
            data.get("extra_request", ""),
        )

    def _normalize_prompt_payload(
        self,
        prompt_id: str,
        title: str,
        summary: str,
        base_prompt: str,
        inputs: dict[str, Any],
        extra_request: str,
    ) -> dict[str, Any]:
        return {
            "prompt_id": str(prompt_id or "")[:80],
            "title": str(title or "프롬프트")[:200],
            "summary": str(summary or "")[:1000],
            "base_prompt": str(base_prompt or "")[:12000],
            "inputs": self._clean_inputs(inputs),
            "extra_request": str(extra_request or "")[:1200],
        }

    def _normalize_payload(
        self,
        prompt_id: Any,
        title: Any,
        summary: Any,
        output_sections: list[Any],
        inputs: dict[str, Any],
        extra_request: Any,
    ) -> dict[str, Any]:
        return {
            "prompt_id": str(prompt_id or "").strip()[:80],
            "title": str(title or "AI 결과").strip()[:200],
            "summary": str(summary or "").strip()[:1000],
            "output_sections": [str(item).strip()[:120] for item in output_sections if str(item).strip()][:12],
            "inputs": self._clean_inputs(inputs),
            "extra_request": str(extra_request or "").strip()[:1000],
        }

    def _clean_inputs(self, inputs: dict[str, Any]) -> dict[str, str]:
        cleaned: dict[str, str] = {}
        for key, value in (inputs or {}).items():
            key_text = str(key).strip()[:80]
            value_text = str(value).strip()[:1000]
            if key_text and value_text:
                cleaned[key_text] = value_text
        return cleaned

    def _inputs_text(self, inputs: dict[str, str], empty: str) -> str:
        if not inputs:
            return empty
        return "\n".join(f"- {key}: {value}" for key, value in inputs.items())

    def _ok(self, mode: str, text: str) -> dict[str, Any]:
        return {
            "status": "ok",
            "mode": mode,
            "provider": AI_PROVIDER,
            "model": self._model,
            "model_file": self._model,
            "text": text,
        }

    def _clean_response(self, text: str) -> str:
        text = (text or "").strip()
        text = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text.strip())
        return text.strip()

    def _require_ready(self) -> None:
        if not self._api_key:
            self._refresh_status_locked()
            raise RuntimeError("Gemini API 키가 필요합니다. Google AI Studio에서 무료 키를 발급해 저장해 주세요.")

    def _normalize_model(self, model: str) -> str:
        allowed = {item["id"] for item in SUPPORTED_MODELS}
        model = str(model or "").strip().replace("models/", "")
        return model if model in allowed else DEFAULT_MODEL

    def _load_settings(self) -> None:
        if not self.settings_path.exists():
            return
        try:
            data = json.loads(self.settings_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return
        if not self._api_key:
            self._api_key = str(data.get("api_key") or "").strip()
        self._model = self._normalize_model(str(data.get("model") or self._model))

    def _save_settings(self) -> None:
        payload = {
            "provider": AI_PROVIDER,
            "model": self._model,
            "api_key": self._api_key,
        }
        self.settings_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def _refresh_status_locked(self) -> None:
        has_key = bool(self._api_key)
        self._status.update({
            "state": "ready" if has_key else "needs_api_key",
            "ready": has_key,
            "progress": 100 if has_key else 0,
            "phase": "온라인 Gemini AI 준비 완료" if has_key else "Gemini API 키를 저장하면 온라인 AI를 사용할 수 있습니다.",
            "error": None if has_key else "Gemini API 키가 필요합니다.",
            "provider": AI_PROVIDER,
            "model": self._model,
            "model_file": self._model,
            "runtime": "online-gemini-rest",
            "mode": "online-generative",
            "api_key_present": has_key,
            "settings_path": str(self.settings_path),
            "supported_models": SUPPORTED_MODELS,
        })

    def _set_status(self, **updates: Any) -> None:
        with self._lock:
            self._status.update(updates)
            self._emit_locked()

    def _emit_locked(self) -> None:
        callback = self._callback
        if callback is not None:
            try:
                callback(dict(self._status))
            except Exception:
                pass


ai_manager = OnlineAIManager()
