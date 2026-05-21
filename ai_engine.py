from __future__ import annotations

import json
import os
import re
import sys
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
        status = self.status()
        if status.get("state") == "error" and not status.get("ready"):
            return self.preview_demo(**payload)
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

    def preview_demo(
        self,
        prompt_id: str = "",
        title: str = "",
        summary: str = "",
        output_sections: list[str] | None = None,
        inputs: dict[str, Any] | None = None,
        extra_request: str = "",
    ) -> dict[str, Any]:
        payload = self._normalize_payload(
            prompt_id=prompt_id,
            title=title,
            summary=summary,
            output_sections=output_sections or [],
            inputs=inputs or {},
            extra_request=extra_request,
        )
        return {
            "status": "fallback",
            "mode": "local-preview-after-ai-error",
            "model": MODEL_REPO,
            "model_file": MODEL_FILE,
            "text": self._fallback_demo(payload),
            "error": self.status().get("error"),
        }

    def improve_prompt(
        self,
        prompt_id: str = "",
        title: str = "",
        summary: str = "",
        base_prompt: str = "",
        inputs: dict[str, Any] | None = None,
        extra_request: str = "",
    ) -> dict[str, Any]:
        safe_payload = self._normalize_prompt_payload(
            prompt_id=prompt_id,
            title=title,
            summary=summary,
            base_prompt=base_prompt,
            inputs=inputs or {},
            extra_request=extra_request,
        )
        if not self.status().get("ready"):
            self.start_async()
            raise RuntimeError("local ai is still initializing")

        self._set_status(state="generating", ready=True, progress=100, phase="로컬 AI가 프롬프트를 보강하는 중")
        try:
            text = self._generate_prompt_improvement(safe_payload)
            text = self._clean_response(text)
            if not text:
                raise RuntimeError("local ai returned an empty prompt")
            return {
                "status": "ok",
                "mode": "local-prompt-improvement",
                "model": MODEL_REPO,
                "model_file": MODEL_FILE,
                "text": text,
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
        self._prepare_llama_runtime_env()
        try:
            from llama_cpp import Llama
        except Exception as exc:
            raise RuntimeError(
                "llama-cpp-python 로딩 실패: EXE에 llama.cpp 네이티브 DLL이 포함되지 않았거나 "
                f"현재 PC에서 로드할 수 없습니다. 원인: {exc}"
            ) from exc

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
            try:
                kwargs.pop("n_batch", None)
                self._llm = Llama(**kwargs)
            except Exception as exc:
                raise RuntimeError(f"SmolLM2 GGUF 모델 로딩 실패: {exc}") from exc
        except Exception as exc:
            raise RuntimeError(f"SmolLM2 GGUF 모델 로딩 실패: {exc}") from exc
        self._set_status(progress=94, phase="SmolLM2 로컬 생성 엔진 준비")

    def _prepare_llama_runtime_env(self) -> None:
        roots = [Path(__file__).resolve().parent]
        if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
            roots.append(Path(sys._MEIPASS))

        candidates: list[Path] = []
        for root in roots:
            candidates.extend(
                [
                    root,
                    root / "llama_cpp",
                    root / "llama_cpp" / "lib",
                    root / "llama_cpp" / "lib" / "cpu",
                ]
            )

        for directory in candidates:
            if not directory.exists():
                continue
            if os.name == "nt" and hasattr(os, "add_dll_directory"):
                try:
                    os.add_dll_directory(str(directory))
                except OSError:
                    pass
            current = os.environ.get("PATH", "")
            path_text = str(directory)
            if path_text not in current.split(os.pathsep):
                os.environ["PATH"] = path_text + os.pathsep + current

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

    def _generate_prompt_improvement(self, payload: dict[str, Any]) -> str:
        if self._llm is None:
            raise RuntimeError("local ai session is not ready")

        messages = [
            {
                "role": "system",
                "content": (
                    "You are an on-device prompt engineering assistant inside a Korean boiler dealer dashboard. "
                    "Rewrite and strengthen the selected operational prompt. "
                    "Do not generate the final business output. Return only the improved prompt text. "
                    "Keep the prompt mostly in English for instruction quality, but require all final outputs to be Korean."
                ),
            },
            {"role": "user", "content": self._build_prompt_improvement_user_prompt(payload)},
        ]

        try:
            response = self._llm.create_chat_completion(
                messages=messages,
                max_tokens=1100,
                temperature=0.55,
                top_p=0.92,
                repeat_penalty=1.08,
            )
            return response["choices"][0]["message"]["content"]
        except Exception:
            prompt = self._format_chat_prompt(messages)
            response = self._llm(
                prompt,
                max_tokens=1100,
                temperature=0.55,
                top_p=0.92,
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

    def _build_prompt_improvement_user_prompt(self, payload: dict[str, Any]) -> str:
        inputs_text = "\n".join(f"- {key}: {value}" for key, value in payload["inputs"].items())
        if not inputs_text:
            inputs_text = "- No dealer fields were filled. Add placeholders and [수정 필요] guards where needed."
        user_request = payload["extra_request"] or "No extra request. Make the prompt more practical for a boiler dealer."
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
{user_request}

[Rewrite Requirements]
1. Return only the revised prompt text. Do not explain what you changed.
2. Preserve the original business goal, but incorporate the user's improvement request deeply.
3. The revised prompt must be more specific to a Korean boiler dealer: region, customer segment, staff workflow, CRM fields, visit flow, KPI, and customer-facing wording.
4. If the request asks for "clean CS manual", make the prompt produce a cleaner, more trustworthy technician/staff service manual: dress, greeting, site cleanup, photo report, complaint response, and follow-up.
5. Keep the instruction body mainly in English, but include Korean section names and require the final answer to be Korean.
6. Add concrete output sections, writing rules, and quality checks so a small local model can produce less generic output.
7. Remove vague wording. Use measurable instructions and short tables where useful.
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
        prompt_id = payload.get("prompt_id") or ""
        if prompt_id == "competitor":
            return self._fallback_competitor(payload)
        if prompt_id == "call":
            return self._fallback_call(payload)
        if prompt_id == "db":
            return self._fallback_db(payload)
        return self._fallback_general(payload)

    def _input(self, payload: dict[str, Any], *keys: str, default: str = "") -> str:
        inputs = payload.get("inputs") or {}
        for key in keys:
            value = inputs.get(key)
            if value:
                return str(value).strip()
        return default

    def _dealer_region(self, payload: dict[str, Any]) -> tuple[str, str]:
        dealer = self._input(payload, "dealer", "대리점명", default="○○보일러 강동대리점")
        region = self._input(payload, "region", "지역", default="서울 강동구 고덕동")
        return dealer, region

    def _fallback_competitor(self, payload: dict[str, Any]) -> str:
        dealer, region = self._dealer_region(payload)
        competitors = self._input(payload, "mainCompetitors", "주요 경쟁사", default="○○가스, △△설비")
        usp = self._input(payload, "ourUSP", "우리만의 USP", default="같은 단지 시공 50건 이상, 토요일 방문 가능, 점검 리포트 무료 제공")
        return f"""# 경쟁사 차별화 포지셔닝 예시

대상: {dealer} / {region}
비교 대상: {competitors}

| 비교 항목 | 우리 대리점 메시지 | 고객에게 보이는 이점 |
|---|---|---|
| 현장 경험 | {usp.splitlines()[0] if usp else '인근 단지 시공 경험 보유'} | 집 구조를 이미 이해하고 방문 시간이 짧습니다 |
| 사후관리 | 점검 리포트와 다음 점검일을 남깁니다 | AS 이후에도 관리받는 느낌을 줍니다 |
| 상담 톤 | 가격 압박보다 안전·온수·소음 문제를 먼저 확인합니다 | 무리한 판매가 아니라 문제 해결로 느껴집니다 |

고객 응대 30초 스크립트:
“고객님, 다른 곳도 비교해 보시는 게 당연합니다. 다만 보일러는 설치 당일 가격보다 설치 후 온수 안정, 배관 정리, 재방문 대응이 더 오래 남습니다. 저희는 {region}에서 실제 방문 경험을 기준으로 먼저 점검하고, 필요한 경우에만 교체를 권합니다. 오늘은 비용보다 현재 증상과 위험 여부를 먼저 확인해 드리겠습니다.”

이번 주 실행: 기존 시공 고객 20명에게 ‘무료 상태 점검 + 비교 견적 검토’ 안내를 보내고, 상담 시 경쟁사를 낮추지 말고 우리 기준표를 보여주세요."""

    def _fallback_call(self, payload: dict[str, Any]) -> str:
        dealer, region = self._dealer_region(payload)
        target = self._input(payload, "targetCustomer", "targetCustomers", "대상 고객", default="노후 보일러 사용 고객")
        offer = self._input(payload, "offer", "제안 내용", default="무상 안심점검")
        return f"""# 알림톡·해피콜 예시

대상: {region} {target}
목표: {offer} 예약 전환

알림톡 초안:
“안녕하세요, {dealer}입니다. 최근 일교차가 커지면서 온수 지연, 난방 소음, 배관 누수 문의가 늘고 있습니다. 이번 주 {region} 고객님을 대상으로 {offer}을 진행합니다. 점검은 약 20분이며, 교체 권유보다 현재 상태 확인을 먼저 도와드립니다. 원하시는 방문 시간만 답장해 주세요.”

전화 첫 멘트:
“고객님, 판매 전화가 아니라 기존 보일러 상태 확인 안내로 연락드렸습니다. 요즘 온수가 늦게 나오거나 소음이 늘어난 적 있으실까요?”

거절 대응:
“네, 괜찮습니다. 대신 겨울 전에는 배기통과 누수 흔적만 한 번 확인해 주세요. 필요하시면 사진으로 먼저 봐드리겠습니다.”

관리표: 발송 50명 → 응답 10명 → 예약 5명 → 점검 완료 4명을 이번 주 기준 KPI로 잡습니다."""

    def _fallback_db(self, payload: dict[str, Any]) -> str:
        dealer, region = self._dealer_region(payload)
        customer_source = self._input(payload, "customerSource", "고객 데이터", default="최근 3년 설치·AS 고객")
        return f"""# 고객 DB 분류표 예시

대상 데이터: {customer_source}
대리점: {dealer} / {region}

| 등급 | 조건 | 이번 주 액션 | 메시지 |
|---|---|---|---|
| A | 설치 7년 이상, AS 1회 이상 | 전화 우선 | “겨울 전 안전점검 대상입니다” |
| B | 설치 4~6년, 문의 이력 있음 | 알림톡 | “온수·소음 증상 체크표를 보내드립니다” |
| C | 신규 설치 1~3년 | 리뷰 요청 | “사용 불편이 없으셨는지 확인드립니다” |

예시 운영:
월요일에는 A등급 20명에게 전화하고, 화요일에는 B등급 40명에게 알림톡을 보냅니다. 금요일에는 응답 고객만 모아 토요일 방문 동선을 짭니다. 무작정 전체 발송하지 말고 ‘노후도 → 문제 이력 → 방문 가능성’ 순서로 좁히면 직원 한 명도 충분히 관리할 수 있습니다.

이번 주 목표: A등급 예약 5건, B등급 응답 8건, C등급 리뷰 5건."""

    def _fallback_general(self, payload: dict[str, Any]) -> str:
        dealer, region = self._dealer_region(payload)
        title = payload.get("title") or "로컬 AI 예시 결과"
        section = (payload.get("output_sections") or ["실행 예시"])[0]
        summary = payload.get("summary") or "현재 입력값을 바탕으로 실행 가능한 대리점 운영 자료를 만듭니다."
        inputs = payload.get("inputs") or {}
        input_lines = "\n".join(f"- {k}: {v}" for k, v in list(inputs.items())[:5])
        if not input_lines:
            input_lines = "- 입력값이 부족하여 소규모 대리점 기준으로 가정했습니다."
        return f"""# {title}

자료 초점: {section}
대상: {dealer} / {region}

핵심 요약:
{summary}

입력 반영:
{input_lines}

실전 예시:
이번 주에는 대상을 넓게 잡기보다 “바로 연락 가능한 고객 20명”만 먼저 뽑습니다. 첫 메시지는 판매보다 점검 중심으로 시작합니다. 예를 들어 “고객님, 이번 안내는 교체 권유가 아니라 겨울 전 안전 확인입니다. 온수 지연, 소음, 누수 흔적 중 하나라도 있으면 사진으로 먼저 확인해 드리겠습니다.”처럼 부담을 낮춥니다.

간단 흐름도:
고객 분류 → 알림톡 발송 → 응답 고객 전화 → 방문 예약 → 점검 결과표 전달 → 리뷰 요청

이번 주 KPI는 응답 8건, 예약 4건, 리뷰 3건으로 작게 잡고 매일 오후 5시에 결과를 기록하세요."""

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

    def _normalize_prompt_payload(
        self,
        prompt_id: str,
        title: str,
        summary: str,
        base_prompt: str,
        inputs: dict[str, Any],
        extra_request: str,
    ) -> dict[str, Any]:
        clean_inputs: dict[str, str] = {}
        for key, value in (inputs or {}).items():
            key_text = str(key).strip()[:80]
            value_text = str(value).strip()[:1000]
            if key_text and value_text:
                clean_inputs[key_text] = value_text
        return {
            "prompt_id": str(prompt_id or "")[:80],
            "title": str(title or "프롬프트")[:200],
            "summary": str(summary or "")[:1000],
            "base_prompt": str(base_prompt or "")[:9000],
            "inputs": clean_inputs,
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
