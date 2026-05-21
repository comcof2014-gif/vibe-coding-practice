from __future__ import annotations

import os
import threading
from pathlib import Path
from typing import Any, Callable


MODEL_REPO = "Xenova/bge-small-en-v1.5"
MODEL_FILE = "model_quantized.onnx"
TOKENIZER_FILE = "tokenizer.json"
MODEL_SIZE_TARGET_BYTES = 30 * 1024 * 1024

MODEL_URLS = {
    MODEL_FILE: f"https://huggingface.co/{MODEL_REPO}/resolve/main/onnx/{MODEL_FILE}?download=true",
    TOKENIZER_FILE: f"https://huggingface.co/{MODEL_REPO}/resolve/main/{TOKENIZER_FILE}?download=true",
}

PROMPT_TEMPLATE_EXAMPLES = [
    {
        "id": "db",
        "title": "고객 DB 분류표",
        "example": "고객 데이터베이스 CRM 설치연수 AS 이력 온수 지연 누수 소음 고객 등급 A B C 리드 분류 무상점검 예약 후보",
    },
    {
        "id": "call",
        "title": "알림톡·해피콜 스크립트",
        "example": "알림톡 문자 전화 해피콜 스크립트 고객 연락 무상 안심점검 예약 거절 대응 멘트 부재중 후속 문자",
    },
    {
        "id": "cs",
        "title": "클린 CS 매뉴얼",
        "example": "기사 방문 품질 CS 매뉴얼 덧신 보양매트 유니폼 고객 응대 방문 전후 체크리스트 리뷰 요청",
    },
    {
        "id": "bs",
        "title": "하절기 B/S 안심점검표",
        "example": "여름 하절기 보일러 무상점검 B/S 안심점검표 배기통 온수 난방 누수 부식 공기질 수질 점검 결과",
    },
    {
        "id": "upsell",
        "title": "업세일링 3대 패키지",
        "example": "업세일링 패키지 객단가 보일러 교체 세트 상품 스마트 온도조절기 필터 고급형 가격대 제안",
    },
    {
        "id": "marketing",
        "title": "SNS·리뷰 4주 캘린더",
        "example": "SNS 블로그 당근마켓 네이버 리뷰 콘텐츠 캘린더 4주 마케팅 게시글 후기 이벤트 지역 커뮤니티",
    },
    {
        "id": "reservation",
        "title": "성수기 예약 대장",
        "example": "성수기 예약 대장 리드타임 일정 관리 가을 겨울 사전 예약 보류 고객 재콜 다음 컨택",
    },
    {
        "id": "complex",
        "title": "단지 공략 전략맵",
        "example": "아파트 단지 공략 후보 단지 세대수 입주연도 시공 이력 관리사무소 게시판 단지별 진입 전략",
    },
    {
        "id": "competitor",
        "title": "경쟁사 차별화 포지셔닝",
        "example": "경쟁사 비교 차별화 포지셔닝 USP 가격 AS 출장 속도 강점 약점 고객 설득 스크립트",
    },
    {
        "id": "b2b",
        "title": "상가·임대인 B2B 영업 확장",
        "example": "상가 임대인 건물주 B2B 영업 정기 점검 계약 제안서 단가표 관리사무소 미팅",
    },
    {
        "id": "kpi",
        "title": "기사 KPI · 인센티브 설계",
        "example": "기사 직원 KPI 인센티브 성과 보너스 점검 완료율 리뷰 획득률 견적 전환율 월말 평가",
    },
    {
        "id": "cashflow",
        "title": "분기별 현금흐름·손익 시뮬레이션",
        "example": "매출 고정비 현금흐름 손익 시뮬레이션 비수기 하락폭 분기별 재무 영업이익 BEP",
    },
    {
        "id": "vip",
        "title": "VIP 락인 · 추천 마케팅",
        "example": "VIP 고객 락인 추천 마케팅 재구매 혜택 등급 리텐션 가족 이웃 소개 보상",
    },
    {
        "id": "unified",
        "title": "고객 응대 통합 매뉴얼",
        "example": "전화 문자 방문 AS 고객 응대 통합 매뉴얼 SLA CRM 기록 어려운 고객 표준 멘트",
    },
    {
        "id": "integrated",
        "title": "비수기 작전 통합 리포트",
        "example": "비수기 작전 통합 리포트 우선 산출물 KPI 실행 기간 16주 계획 직원 액션 캘린더",
    },
    {
        "id": "fortune",
        "title": "오늘의 운세",
        "example": "운세 타로 사주 별자리 MBTI 행운의 숫자 색 연애운 금전운 건강운 재미 이스터에그",
    },
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
        self._lock = threading.RLock()
        self._thread: threading.Thread | None = None
        self._callback: ProgressCallback | None = None
        self._session: Any = None
        self._tokenizer: Any = None
        self._template_embeddings: list[Any] | None = None
        self._status: dict[str, Any] = {
            "state": "idle",
            "ready": False,
            "progress": 0,
            "phase": "로컬 AI 초기화 대기",
            "error": None,
            "model_dir": str(self.model_dir),
            "model_repo": MODEL_REPO,
            "model_file": MODEL_FILE,
            "model_size_mb": None,
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
            self._set_status_locked(state="initializing", progress=1, phase="로컬 AI 엔진 준비 시작", error=None)
            self._thread = threading.Thread(target=self._initialize, name="dealer-local-ai", daemon=True)
            self._thread.start()
            return self.status()

    def match(self, text: str, top_k: int = 3) -> dict[str, Any]:
        if not text.strip():
            raise ValueError("text is required")
        if not self.status().get("ready"):
            self.start_async()
            raise RuntimeError("local ai is still initializing")

        query_embedding = self._embed(text)
        template_embeddings = self._ensure_template_embeddings()
        import numpy as np

        scores: list[dict[str, Any]] = []
        for template, embedding in zip(PROMPT_TEMPLATE_EXAMPLES, template_embeddings):
            score = float(np.dot(query_embedding, embedding))
            scores.append(
                {
                    "id": template["id"],
                    "title": template["title"],
                    "score": round(score, 4),
                }
            )
        scores.sort(key=lambda item: item["score"], reverse=True)
        return {
            "status": "ok",
            "model": MODEL_REPO,
            "best": scores[0],
            "matches": scores[: max(1, top_k)],
        }

    def _initialize(self) -> None:
        try:
            self._download_required_files()
            self._load_engine()
            self._ensure_template_embeddings()
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
        for index, filename in enumerate((MODEL_FILE, TOKENIZER_FILE)):
            start = 5 + index * 30
            end = start + 28
            self._download_file(filename, MODEL_URLS[filename], start, end)

    def _download_file(self, filename: str, url: str, start_progress: int, end_progress: int) -> None:
        target = self.model_dir / filename
        if target.exists() and target.stat().st_size > 0:
            self._record_model_size(target)
            self._set_status(progress=end_progress, phase=f"{filename} 이미 저장됨")
            return

        import requests

        tmp = target.with_suffix(target.suffix + ".tmp")
        self._set_status(progress=start_progress, phase=f"{filename} 다운로드 시작")
        with requests.get(url, stream=True, timeout=(10, 60)) as response:
            response.raise_for_status()
            total = int(response.headers.get("content-length") or 0)
            downloaded = 0
            with tmp.open("wb") as fh:
                for chunk in response.iter_content(chunk_size=256 * 1024):
                    if not chunk:
                        continue
                    fh.write(chunk)
                    downloaded += len(chunk)
                    if total:
                        ratio = min(downloaded / total, 1.0)
                        progress = int(start_progress + (end_progress - start_progress) * ratio)
                        self._set_status(progress=progress, phase=f"{filename} 다운로드 중")
        tmp.replace(target)
        self._record_model_size(target)
        self._set_status(progress=end_progress, phase=f"{filename} 저장 완료")

    def _record_model_size(self, target: Path) -> None:
        if target.name != MODEL_FILE:
            return
        size = target.stat().st_size
        size_mb = round(size / (1024 * 1024), 1)
        warning = None
        if size > MODEL_SIZE_TARGET_BYTES:
            warning = f"{MODEL_FILE} 크기가 {size_mb}MB로 30MB 목표보다 큽니다."
        self._set_status(model_size_mb=size_mb, size_warning=warning)

    def _load_engine(self) -> None:
        self._set_status(progress=70, phase="Tokenizer 로딩")
        from tokenizers import Tokenizer

        self._tokenizer = Tokenizer.from_file(str(self.model_dir / TOKENIZER_FILE))
        try:
            self._tokenizer.enable_truncation(max_length=512)
            self._tokenizer.enable_padding(length=512, pad_id=0, pad_token="[PAD]")
        except Exception:
            pass

        self._set_status(progress=82, phase="ONNX Runtime 세션 생성")
        import onnxruntime as ort

        self._session = ort.InferenceSession(
            str(self.model_dir / MODEL_FILE),
            providers=["CPUExecutionProvider"],
        )

    def _ensure_template_embeddings(self) -> list[Any]:
        if self._template_embeddings is not None:
            return self._template_embeddings
        self._set_status(progress=92, phase="프롬프트 템플릿 임베딩 생성")
        self._template_embeddings = [self._embed(item["example"]) for item in PROMPT_TEMPLATE_EXAMPLES]
        return self._template_embeddings

    def _embed(self, text: str) -> Any:
        if self._session is None or self._tokenizer is None:
            raise RuntimeError("local ai session is not ready")

        import numpy as np

        encoded = self._tokenizer.encode(text)
        input_ids = encoded.ids[:512]
        attention_mask = encoded.attention_mask[:512]
        pad_len = max(0, 512 - len(input_ids))
        if pad_len:
            input_ids = input_ids + [0] * pad_len
            attention_mask = attention_mask + [0] * pad_len

        feed: dict[str, Any] = {}
        for item in self._session.get_inputs():
            if item.name == "input_ids":
                feed[item.name] = np.asarray([input_ids], dtype=np.int64)
            elif item.name == "attention_mask":
                feed[item.name] = np.asarray([attention_mask], dtype=np.int64)
            elif item.name == "token_type_ids":
                feed[item.name] = np.zeros((1, len(input_ids)), dtype=np.int64)

        outputs = self._session.run(None, feed)
        hidden = outputs[0]
        if hidden.ndim == 2:
            embedding = hidden[0].astype(np.float32)
        else:
            mask = np.asarray(attention_mask, dtype=np.float32)[None, :, None]
            denom = np.maximum(mask.sum(axis=1), 1e-9)
            embedding = ((hidden * mask).sum(axis=1) / denom)[0].astype(np.float32)
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        return embedding

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
