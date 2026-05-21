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
            "mode": "local-generative",
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
        payload = self._parse_demo_payload(text) or {
            "prompt_id": "freeform",
            "title": "사용자 요청 기반 결과",
            "summary": "입력 내용을 바탕으로 실행 가능한 결과를 작성합니다.",
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
        payload = self._normalize_payload(prompt_id, title, summary, output_sections or [], inputs or {}, extra_request)
        if not self.status().get("ready"):
            self.start_async()
            raise RuntimeError("local ai is still initializing")

        self._set_status(state="generating", ready=True, progress=100, phase="로컬 AI가 결과를 작성하는 중")
        try:
            text = self._generate_chat(
                system=(
                    "너는 한국 보일러 대리점장 대시보드 안에서 실행되는 오프라인 로컬 AI다. "
                    "외부 API나 다른 AI 서비스를 언급하지 말고, 바로 사용할 수 있는 한국어 실무 결과만 작성한다."
                ),
                user=self._build_demo_user_prompt(payload),
                max_tokens=850,
                temperature=0.38,
            )
            return self._ok("local-demo", self._clean_response(text) or self._fallback_demo(payload))
        except Exception as exc:
            return self._fallback("local-demo", self._fallback_demo(payload), exc)
        finally:
            self._set_status(state="ready", ready=True, progress=100, phase="로컬 AI 준비 완료")

    def preview_demo(self, **kwargs: Any) -> dict[str, Any]:
        payload = self._normalize_payload(
            kwargs.get("prompt_id", ""),
            kwargs.get("title", ""),
            kwargs.get("summary", ""),
            kwargs.get("output_sections") or [],
            kwargs.get("inputs") or {},
            kwargs.get("extra_request", ""),
        )
        return self._fallback("local-preview", self._fallback_demo(payload), self.status().get("error"))

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
        if not self.status().get("ready"):
            self.start_async()
            raise RuntimeError("local ai is still initializing")

        self._set_status(state="generating", ready=True, progress=100, phase="로컬 AI가 프롬프트를 보강하는 중")
        try:
            text = self._generate_chat(
                system=(
                    "You are an on-device prompt engineering assistant inside a Korean boiler dealer dashboard. "
                    "Rewrite and strengthen the selected operational prompt. Return only the improved prompt text. "
                    "Keep the prompt mostly in English for instruction quality, but require final outputs in Korean."
                ),
                user=self._build_prompt_improvement_user_prompt(payload),
                max_tokens=1100,
                temperature=0.55,
            )
            text = self._clean_response(text)
            return self._ok("local-prompt-improvement", text or self._fallback_prompt_improvement(payload))
        except Exception as exc:
            return self._fallback("local-prompt-improvement", self._fallback_prompt_improvement(payload), exc)
        finally:
            self._set_status(state="ready", ready=True, progress=100, phase="로컬 AI 준비 완료")

    def run_prompt(
        self,
        prompt_id: str = "",
        title: str = "",
        prompt_text: str = "",
        inputs: dict[str, Any] | None = None,
        extra_request: str = "",
    ) -> dict[str, Any]:
        payload = self._normalize_prompt_payload(prompt_id, title, "", prompt_text, inputs or {}, extra_request)
        if not self.status().get("ready"):
            self.start_async()
            raise RuntimeError("local ai is still initializing")

        self._set_status(state="generating", ready=True, progress=100, phase="로컬 AI가 보강 프롬프트를 실행하는 중")
        try:
            text = self._generate_chat(
                system=(
                    "You are an offline local AI inside a Korean boiler dealer dashboard. "
                    "Execute the provided prompt using the dealer inputs. Return only the practical Korean result."
                ),
                user=self._build_prompt_run_user_prompt(payload),
                max_tokens=950,
                temperature=0.42,
            )
            text = self._clean_response(text)
            return self._ok("local-prompt-run", text or self._fallback_run(payload))
        except Exception as exc:
            return self._fallback("local-prompt-run", self._fallback_run(payload), exc)
        finally:
            self._set_status(state="ready", ready=True, progress=100, phase="로컬 AI 준비 완료")

    def _initialize(self) -> None:
        try:
            self._download_required_files()
            self._load_engine()
            self._set_status(state="ready", ready=True, progress=100, phase="로컬 AI 준비 완료", error=None)
        except Exception as exc:
            self._set_status(state="error", ready=False, phase="로컬 AI 초기화 실패", error=str(exc))

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
        with requests.get(MODEL_URL, headers={"User-Agent": "dealer-dashboard-local-ai/1.0"}, stream=True, timeout=(10, 90)) as response:
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
                        self._set_status(progress=int(5 + 60 * min(downloaded / total, 1.0)), phase="SmolLM2 GGUF 모델 다운로드 중")
        tmp.replace(self.model_path)
        self._record_model_size(self.model_path)
        self._set_status(progress=70, phase="SmolLM2 GGUF 모델 저장 완료")

    def _record_model_size(self, target: Path) -> None:
        size = target.stat().st_size
        size_mb = round(size / (1024 * 1024), 1)
        if size > MODEL_SIZE_LIMIT_BYTES:
            raise RuntimeError(f"{MODEL_FILE} is {size_mb}MB, over the 200MB local-model limit.")
        self._set_status(model_size_mb=size_mb)

    def _load_engine(self) -> None:
        self._set_status(progress=82, phase="llama.cpp 로컬 런타임 로딩")
        self._prepare_llama_runtime_env()
        try:
            from llama_cpp import Llama
        except Exception as exc:
            raise RuntimeError(f"llama-cpp-python 로딩 실패: {exc}") from exc

        kwargs = {
            "model_path": str(self.model_path),
            "n_ctx": 2048,
            "n_batch": 128,
            "n_threads": max(1, min(6, os.cpu_count() or 4)),
            "n_gpu_layers": 0,
            "verbose": False,
        }
        try:
            self._llm = Llama(**kwargs)
        except TypeError:
            kwargs.pop("n_batch", None)
            self._llm = Llama(**kwargs)
        except Exception as exc:
            raise RuntimeError(f"SmolLM2 GGUF 모델 로딩 실패: {exc}") from exc
        self._set_status(progress=94, phase="SmolLM2 로컬 생성 엔진 준비")

    def _prepare_llama_runtime_env(self) -> None:
        roots = [Path(__file__).resolve().parent]
        if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
            roots.append(Path(sys._MEIPASS))
        for root in roots:
            for directory in [root, root / "llama_cpp", root / "llama_cpp" / "lib", root / "llama_cpp" / "lib" / "cpu"]:
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

    def _generate_chat(self, system: str, user: str, max_tokens: int, temperature: float) -> str:
        if self._llm is None:
            raise RuntimeError("local ai session is not ready")
        messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
        try:
            response = self._llm.create_chat_completion(
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=0.9,
                repeat_penalty=1.08,
            )
            return response["choices"][0]["message"]["content"]
        except Exception:
            prompt = self._format_chat_prompt(messages)
            response = self._llm(
                prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=0.9,
                repeat_penalty=1.08,
                stop=["<|im_end|>", "</s>"],
            )
            return response["choices"][0]["text"]

    def _build_demo_user_prompt(self, payload: dict[str, Any]) -> str:
        inputs_text = self._inputs_text(payload["inputs"], empty="- 입력값 없음: 필요한 값은 [수정 필요]로 표시")
        sections = "\n".join(f"- {item}" for item in payload["output_sections"]) or "- 핵심 요약\n- 실행 표\n- 바로 쓸 문구\n- 이번 주 액션"
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
- 표, 체크리스트, 고객 응대 문구를 섞어 700~1000자 안에서 작성합니다.
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
4. If the request asks for clean CS or better happy-call quality, include greeting, tone, refusal handling, follow-up, and quality checks.
5. Keep instructions mainly in English, include Korean section names, and require final outputs in Korean.
6. Add concrete output sections, writing rules, missing-data guards, and quality checks.
7. Do not invent dates, customer names, or unsupported facts.
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
- 프롬프트 설명이나 모델 설명은 쓰지 않습니다.
- 표, 체크리스트, 대본, 실행 순서를 포함합니다.
- 부족한 입력값은 [수정 필요]로 표시합니다.
- 700~1000자 안에서 구체적으로 작성합니다.
""".strip()

    def _inputs_text(self, inputs: dict[str, str], empty: str) -> str:
        if not inputs:
            return empty
        return "\n".join(f"- {key}: {value}" for key, value in inputs.items())

    def _fallback_prompt_improvement(self, payload: dict[str, Any]) -> str:
        inputs_text = self._inputs_text(payload["inputs"], empty="- [수정 필요] 대리점명, 담당 지역, 핵심 고객층, 선호 채널")
        return f"""[ROLE]
You are a practical sales and operations prompt writer for a Korean boiler dealer. The final answer must be written in Korean.

[CONTEXT]
- Prompt title: {payload["title"]}
- Dealer inputs:
{inputs_text}
- Additional improvement request: {payload["extra_request"] or "현장 실행성을 높인다."}

[TASK]
Rewrite the output as a field-ready dealer document. Preserve the original goal, but make it specific and measurable.

[REQUIRED OUTPUT SECTIONS]
1. 핵심 목적
2. 현장 적용 조건
3. 실행 표: task, owner, timing, wording, metric
4. 고객 응대 문구: KakaoTalk, phone, refusal handling
5. 품질 체크: missing inputs, no fake dates, no invented customer names

[WRITING RULES]
- Use Korean business politeness for customer-facing text.
- Use [수정 필요] for missing dealer-specific data.
- Do not invent exact numbers unless marked as "가정".

[ORIGINAL PROMPT]
{payload["base_prompt"]}"""

    def _fallback_run(self, payload: dict[str, Any]) -> str:
        inputs_text = self._inputs_text(payload["inputs"], empty="- [수정 필요] 현장 입력값을 더 입력해 주세요.")
        return f"""# {payload["title"] or "로컬 AI 적용 결과"}

입력 반영:
{inputs_text}

핵심 실행안:
이번 작업은 고객에게 바로 전달할 수 있는 문구와 내부 실행 순서를 함께 정리하는 방식으로 진행합니다. 부족한 값은 [수정 필요]로 표시하고, 확인되지 않은 날짜나 수치는 임의로 만들지 않습니다.

실행 표:
| 단계 | 담당 | 내용 | 확인 기준 |
|---|---|---|---|
| 1 | 관리자 | 대상 고객과 지역을 확정 | [수정 필요] 고객군 |
| 2 | 상담 직원 | 알림톡 또는 전화 첫 문구 발송 | 응답 여부 기록 |
| 3 | 기사 | 방문 전 증상과 사진 확인 | 누수, 소음, 온수 지연 |
| 4 | 관리자 | 결과표 전달 및 후속 연락 | 리뷰/재방문 여부 |

고객 문구:
“고객님, 이번 안내는 무리한 교체 권유가 아니라 현재 보일러 상태를 먼저 확인해 드리기 위한 연락입니다. 온수 지연, 소음, 누수 흔적 중 하나라도 있으시면 사진으로 먼저 확인해 드리겠습니다.”

품질 체크:
확인되지 않은 일정, 고객명, 가격은 넣지 말고 [수정 필요]로 남겨 주세요."""

    def _fallback_demo(self, payload: dict[str, Any]) -> str:
        return self._fallback_run({
            "title": payload.get("title") or "로컬 AI 결과",
            "inputs": payload.get("inputs") or {},
            "base_prompt": payload.get("summary") or "",
        })

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
            "base_prompt": str(base_prompt or "")[:10000],
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
            "title": str(title or "로컬 AI 결과").strip()[:200],
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

    def _ok(self, mode: str, text: str) -> dict[str, Any]:
        return {"status": "ok", "mode": mode, "model": MODEL_REPO, "model_file": MODEL_FILE, "text": text}

    def _fallback(self, mode: str, text: str, exc: Any) -> dict[str, Any]:
        return {
            "status": "fallback",
            "mode": mode,
            "model": MODEL_REPO,
            "model_file": MODEL_FILE,
            "text": text,
            "error": str(exc) if exc else None,
        }

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
