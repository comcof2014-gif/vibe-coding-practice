from __future__ import annotations

import json
import os
import re
import threading
from pathlib import Path
from typing import Any, Callable


MODEL_REPO = "QuantFactory/SmolLM2-135M-Instruct-GGUF"
MODEL_FILE = "SmolLM2-135M-Instruct.Q4_K_M.gguf"
MODEL_URL = f"https://huggingface.co/{MODEL_REPO}/resolve/main/{MODEL_FILE}?download=true"
MODEL_SIZE_LIMIT_BYTES = 200 * 1024 * 1024
MODEL_LICENSE = "apache-2.0"

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

ProgressCallback = Callable[[dict[str, Any]], None]


def get_model_dir() -> Path:
    override = os.environ.get("DEALER_DASHBOARD_AI_DIR")
    if override:
        base = Path(override)
    elif os.name == "nt" and os.environ.get("APPDATA"):
        base = Path(os.environ["APPDATA"]) / "dealer-dashboard-ai"
    else:
        base = Path.home() / ".dealer-dashboard-ai"
    base.mkdir(parents=True, exist_ok=True)
    return base


class LocalAIManager:
    def __init__(self) -> None:
        self.model_dir = get_model_dir()
        self.model_path = self.model_dir / MODEL_FILE
        self._lock = threading.RLock()
        self._thread: threading.Thread | None = None
        self._callback: ProgressCallback | None = None
        self._llm: Any = None
        self._status: dict[str, Any] = {
            "state": "idle",
            "ready": False,
            "progress": 0,
            "phase": "로컬 생성형 AI 초기화 대기",
            "error": None,
            "model_dir": str(self.model_dir),
            "model_repo": MODEL_REPO,
            "model_file": MODEL_FILE,
            "model_license": MODEL_LICENSE,
            "model_size_mb": None,
            "model_size_limit_mb": round(MODEL_SIZE_LIMIT_BYTES / (1024 * 1024)),
            "runtime": "llama-cpp-python",
            "mode": "local-generative-demo",
            "size_warning": None,
        }

    def status(self) -> dict[str, Any]:
        with self._lock:
            return dict(self._status)

    def start_async(self, progress_callback: ProgressCallback | None = None) -> dict[str, Any]:
        with self._lock:
            if progress_callback is not None:
                self._callback = progress_callback
            if self._status["ready"]:
                return self.status()
            if self._thread and self._thread.is_alive():
                return self.status()
            self._set_status_locked(
                state="initializing",
                ready=False,
                progress=1,
                phase="SmolLM2 로컬 AI 준비 시작",
                error=None,
            )
            self._thread = threading.Thread(target=self._initialize, name="dealer-local-ai", daemon=True)
            self._thread.start()
            return self.status()

    def match(self, text: str, top_k: int = 3) -> dict[str, Any]:
        """Compatibility endpoint: generate a demo result instead of choosing a template."""
        if not text.strip():
            raise ValueError("text is required")
        payload = self._parse_demo_payload(text)
        if payload is None:
            payload = {
                "prompt_id": "freeform",
                "title": "사용자 요청 기반 예시 결과",
                "summary": "사용자가 입력한 내용을 바탕으로 실행 가능한 데모 결과를 작성합니다.",
                "output_sections": [],
                "inputs": {"요청": text.strip()},
                "extra_request": "",
            }
        return self.compose_demo(**payload)

    def compose_demo(
        self,
        prompt_id: str = "",
        title: str = "",
        summary: str = "",
        output_sections: list[str] | None = None,
        inputs: dict[str, Any] | None = None,
        extra_request: str = "",
    ) -> dict[str, Any]:
        if not self.status().get("ready"):
            self.start_async()
            raise RuntimeError("local ai is still initializing")

        safe_payload = self._normalize_payload(
            prompt_id=prompt_id,
            title=title,
            summary=summary,
            output_sections=output_sections or [],
            inputs=inputs or {},
            extra_request=extra_request,
        )

        self._set_status(state="generating", ready=True, progress=100, phase="로컬 AI가 예시 결과를 작성하는 중")
        try:
            text = self._generate_text(safe_payload)
            text = self._clean_response(text)
            if not text:
                text = self._fallback_demo(safe_payload)
            return {
                "status": "ok",
                "mode": "local-generative-demo",
                "model": MODEL_REPO,
                "model_file": MODEL_FILE,
                "text": text,
            }
        except Exception as exc:
            return {
                "status": "fallback",
                "mode": "local-generative-demo",
                "model": MODEL_REPO,
                "model_file": MODEL_FILE,
                "text": self._fallback_demo(safe_payload),
                "error": str(exc),
            }
        finally:
            self._set_status(state="ready", ready=True, progress=100, phase="로컬 AI 준비 완료")

    def _initialize(self) -> None:
        try:
            self._download_required_files()
            self._load_engine()
            self._set_status(
                state="ready",
                ready=True,
                progress=100,
                phase="로컬 AI 준비 완료",
                error=None,
            )
        except Exception as exc:
            self._set_status(
                state="error",
                ready=False,
                phase="로컬 AI 초기화 실패",
                error=str(exc),
            )

    def _download_required_files(self) -> None:
        if self.model_path.exists() and self.model_path.stat().st_size > 1024 * 1024:
            self._record_model_size(self.model_path)
            self._set_status(progress=70, phase=f"{MODEL_FILE} 이미 저장됨")
            return

        import requests

        tmp = self.model_path.with_suffix(self.model_path.suffix + ".tmp")
        if tmp.exists():
            tmp.unlink()

        self._set_status(progress=5, phase="SmolLM2 GGUF 모델 다운로드 시작")
        headers = {"User-Agent": "dealer-dashboard-local-ai/1.0"}
        with requests.get(MODEL_URL, headers=headers, stream=True, timeout=(10, 90)) as response:
            response.raise_for_status()
            total = int(response.headers.get("content-length") or 0)
            downloaded = 0
            with tmp.open("wb") as fh:
                for chunk in response.iter_content(chunk_size=512 * 1024):
                    if not chunk:
                        continue
                    fh.write(chunk)
                    downloaded += len(chunk)
                    if total:
                        progress = int(5 + 60 * min(downloaded / total, 1.0))
                        self._set_status(progress=progress, phase="SmolLM2 GGUF 모델 다운로드 중")
        tmp.replace(self.model_path)
        self._record_model_size(self.model_path)
        self._set_status(progress=70, phase="SmolLM2 GGUF 모델 저장 완료")

    def _record_model_size(self, target: Path) -> None:
        size = target.stat().st_size
        size_mb = round(size / (1024 * 1024), 1)
        if size > MODEL_SIZE_LIMIT_BYTES:
            raise RuntimeError(f"{MODEL_FILE} is {size_mb}MB, over the 200MB local-model limit.")
        self._set_status(model_size_mb=size_mb, size_warning=None)

    def _load_engine(self) -> None:
        self._set_status(progress=82, phase="llama.cpp 로컬 런타임 로딩")
        from llama_cpp import Llama

        threads = max(1, min(6, os.cpu_count() or 4))
        kwargs = {
            "model_path": str(self.model_path),
            "n_ctx": 2048,
            "n_batch": 128,
            "n_threads": threads,
            "n_gpu_layers": 0,
            "verbose": False,
        }
        try:
            self._llm = Llama(**kwargs)
        except TypeError:
            kwargs.pop("n_batch", None)
            self._llm = Llama(**kwargs)
        self._set_status(progress=94, phase="SmolLM2 로컬 생성 엔진 준비")

    def _generate_text(self, payload: dict[str, Any]) -> str:
        if self._llm is None:
            raise RuntimeError("local ai session is not ready")

        messages = [
            {
                "role": "system",
                "content": (
                    "너는 한국 보일러 대리점장 대시보드 안에서 실행되는 오프라인 로컬 AI다. "
                    "외부 API, ChatGPT, Claude, Gemini를 언급하지 않는다. "
                    "현재 선택된 프롬프트의 오른쪽 '예시 결과' 화면에 바로 넣을 수 있는 실제 산출물만 작성한다. "
                    "모든 답변은 자연스러운 한국어 존댓말로 작성한다."
                ),
            },
            {"role": "user", "content": self._build_user_prompt(payload)},
        ]

        try:
            response = self._llm.create_chat_completion(
                messages=messages,
                max_tokens=720,
                temperature=0.35,
                top_p=0.9,
                repeat_penalty=1.08,
            )
            return response["choices"][0]["message"]["content"]
        except Exception:
            prompt = self._format_chat_prompt(messages)
            response = self._llm(
                prompt,
                max_tokens=720,
                temperature=0.35,
                top_p=0.9,
                repeat_penalty=1.08,
                stop=["<|im_end|>", "</s>"],
            )
            return response["choices"][0]["text"]

    def _build_user_prompt(self, payload: dict[str, Any]) -> str:
        inputs_text = "\n".join(f"- {key}: {value}" for key, value in payload["inputs"].items())
        if not inputs_text:
            inputs_text = "- 입력값 없음: 현실적인 예시값을 작게 가정하고, 가정이라고 표시"
        sections_text = "\n".join(f"- {item}" for item in payload["output_sections"])
        if not sections_text:
            sections_text = "- 핵심 요약\n- 실행 표\n- 바로 쓸 문구\n- 이번 주 액션"
        extra = payload["extra_request"] or "없음"
        return f"""
[현재 선택된 프롬프트]
- ID: {payload["prompt_id"]}
- 제목: {payload["title"]}
- 설명: {payload["summary"]}

[사용자가 입력한 현장 정보]
{inputs_text}

[반드시 보여줄 결과 구성]
{sections_text}

[추가 요청]
{extra}

[작성 규칙]
- 프롬프트 추천이나 템플릿 선택을 하지 말고, 최종 예시 결과만 작성합니다.
- 실제 대리점장 화면에 붙여넣을 수 있게 표, 체크리스트, 짧은 문구를 섞어 작성합니다.
- 입력에 없는 숫자는 작은 범위로 가정하되 "가정"이라고 표시합니다.
- 너무 길게 늘리지 말고 핵심 결과가 한 화면에서 읽히도록 900자 내외로 작성합니다.
- 마크다운 코드블록은 사용하지 않습니다.
""".strip()

    def _format_chat_prompt(self, messages: list[dict[str, str]]) -> str:
        body = ""
        for message in messages:
            body += f"<|im_start|>{message['role']}\n{message['content']}<|im_end|>\n"
        return body + "<|im_start|>assistant\n"

    def _clean_response(self, text: str) -> str:
        text = (text or "").strip()
        for token in ("<|im_end|>", "<|endoftext|>", "</s>"):
            text = text.replace(token, "")
        text = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", text.strip())
        text = re.sub(r"\s*```$", "", text.strip())
        return text.strip()

    def _fallback_demo(self, payload: dict[str, Any]) -> str:
        title = payload["title"] or "로컬 AI 예시 결과"
        lines = [
            f"# {title}",
            "",
            "## 핵심 요약",
            f"- {payload['summary'] or '선택한 프롬프트 기준으로 실행 가능한 예시 결과를 작성했습니다.'}",
            "- 입력값이 부족한 항목은 소규모 대리점 기준으로 가정했습니다.",
            "",
            "## 입력 반영",
        ]
        for key, value in payload["inputs"].items():
            lines.append(f"- {key}: {value}")
        lines += ["", "## 결과 구성"]
        for section in payload["output_sections"] or ["이번 주 액션", "고객 안내 문구", "관리 체크리스트"]:
            lines.append(f"- {section}: 바로 실행할 수 있는 짧은 표와 문구로 정리")
        lines += [
            "",
            "## 이번 주 액션",
            "1. 입력 정보 중 비어 있는 항목을 먼저 채웁니다.",
            "2. 우선 고객군을 10명 단위로 나누고 연락 문구를 적용합니다.",
            "3. 실행 후 예약, 응답, 리뷰 지표를 매일 기록합니다.",
        ]
        return "\n".join(lines)

    def _parse_demo_payload(self, text: str) -> dict[str, Any] | None:
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            return None
        if not isinstance(data, dict) or data.get("mode") != "demo":
            return None
        return self._normalize_payload(
            prompt_id=data.get("prompt_id", ""),
            title=data.get("title", ""),
            summary=data.get("summary", ""),
            output_sections=data.get("output_sections") or [],
            inputs=data.get("inputs") or {},
            extra_request=data.get("extra_request", ""),
        )

    def _normalize_payload(
        self,
        prompt_id: Any,
        title: Any,
        summary: Any,
        output_sections: list[Any],
        inputs: dict[str, Any],
        extra_request: Any,
    ) -> dict[str, Any]:
        clean_inputs: dict[str, str] = {}
        for key, value in (inputs or {}).items():
            k = str(key).strip()[:80]
            v = str(value).strip()[:1000]
            if k and v:
                clean_inputs[k] = v
        return {
            "prompt_id": str(prompt_id or "").strip()[:80],
            "title": str(title or "로컬 AI 예시 결과").strip()[:200],
            "summary": str(summary or "").strip()[:1000],
            "output_sections": [str(item).strip()[:120] for item in output_sections if str(item).strip()][:12],
            "inputs": clean_inputs,
            "extra_request": str(extra_request or "").strip()[:1000],
        }

    def _set_status(self, **updates: Any) -> None:
        with self._lock:
            self._set_status_locked(**updates)

    def _set_status_locked(self, **updates: Any) -> None:
        self._status.update(updates)
        snapshot = dict(self._status)
        callback = self._callback
        if callback is not None:
            try:
                callback(snapshot)
            except Exception:
                pass


ai_manager = LocalAIManager()
