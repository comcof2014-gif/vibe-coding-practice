import json
import os
import re
import sys
import threading
import webbrowser
import html as html_lib
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import List
from urllib.parse import parse_qs, unquote, urlencode, urlparse
from uuid import uuid4

import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field, field_validator

from ai_engine import PROMPT_TEMPLATE_EXAMPLES, ai_manager


def get_resource_dir() -> Path:
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent


BASE_DIR = get_resource_dir()
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"


def get_config_dir() -> Path:
    override = os.environ.get("DEALER_DASHBOARD_CONFIG_DIR")
    if override:
        base = Path(override)
    elif os.name == "nt" and os.environ.get("APPDATA"):
        base = Path(os.environ["APPDATA"]) / "dealer-dashboard"
    else:
        base = Path.home() / ".config" / "dealer-dashboard"
    base.mkdir(parents=True, exist_ok=True)
    return base


CONFIG_PATH = get_config_dir() / "config.json"
_config_lock = threading.Lock()

PRESET_COLORS = [
    "#0369a1",
    "#dc2626",
    "#16a34a",
    "#ca8a04",
    "#9333ea",
    "#db2777",
    "#0d9488",
    "#57534e",
]

DEFAULT_CONFIG = {
    "notification_times": ["09:00", "13:00", "18:00"],
    "notification_message": "오늘 일일 영업·마감 체크리스트를 확인하세요.",
    "shortcuts": [],
    "calendar": [],
}

MAX_PER_DAY = 5
TITLE_MAX_LEN = 12
HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
TRUSTED_SCHEDULE_DOMAINS = [
    "go.kr",
    "korea.kr",
    "mois.go.kr",
    "mcst.go.kr",
    "visitkorea.or.kr",
    "korean.visitkorea.or.kr",
    "date.nager.at",
    "timeanddate.com",
]
HOLIDAY_KEYWORDS = ("공휴일", "대체공휴일", "대체휴무", "휴일", "국가공휴일", "빨간날")


def load_config() -> dict:
    with _config_lock:
        if not CONFIG_PATH.exists():
            CONFIG_PATH.write_text(json.dumps(DEFAULT_CONFIG, ensure_ascii=False, indent=2), encoding="utf-8")
            return json.loads(json.dumps(DEFAULT_CONFIG))
        try:
            data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            data = json.loads(json.dumps(DEFAULT_CONFIG))
        for k, v in DEFAULT_CONFIG.items():
            data.setdefault(k, v if not isinstance(v, list) else list(v))
        return data


def save_config(data: dict) -> None:
    with _config_lock:
        CONFIG_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


class NotificationSettings(BaseModel):
    notification_times: List[str] = Field(default_factory=list)
    notification_message: str = ""

    @field_validator("notification_times")
    @classmethod
    def _validate_times(cls, v: List[str]) -> List[str]:
        cleaned: List[str] = []
        for t in v:
            t = t.strip()
            if not t:
                continue
            parts = t.split(":")
            if len(parts) != 2 or not all(p.isdigit() for p in parts):
                raise ValueError(f"invalid time format: {t}")
            h, m = int(parts[0]), int(parts[1])
            if not (0 <= h < 24 and 0 <= m < 60):
                raise ValueError(f"out of range: {t}")
            cleaned.append(f"{h:02d}:{m:02d}")
        seen, out = set(), []
        for t in cleaned:
            if t not in seen:
                out.append(t)
                seen.add(t)
        return out


class ShortcutIn(BaseModel):
    name: str
    url: str

    @field_validator("name")
    @classmethod
    def _validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name is required")
        if len(v) > 60:
            raise ValueError("name too long")
        return v

    @field_validator("url")
    @classmethod
    def _validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("url is required")
        parsed = urlparse(v)
        if parsed.scheme not in ("http", "https"):
            raise ValueError("url must start with http:// or https://")
        if not parsed.netloc:
            raise ValueError("url must include a host")
        return v


class CalendarEntryIn(BaseModel):
    date: str
    title: str
    color: str = "#0369a1"

    @field_validator("date")
    @classmethod
    def _validate_date(cls, v: str) -> str:
        v = v.strip()
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("date must be YYYY-MM-DD")
        return v

    @field_validator("title")
    @classmethod
    def _validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("title is required")
        if len(v) > TITLE_MAX_LEN:
            raise ValueError(f"title too long (max {TITLE_MAX_LEN} chars)")
        return v

    @field_validator("color")
    @classmethod
    def _validate_color(cls, v: str) -> str:
        v = v.strip()
        if not HEX_RE.match(v):
            raise ValueError("color must be hex like #RRGGBB")
        return v.lower()


class CalendarAiSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=200)
    region: str = Field(default="", max_length=120)
    year: int = Field(default_factory=lambda: datetime.now().year, ge=2024, le=2100)
    month: int = Field(default_factory=lambda: datetime.now().month, ge=1, le=12)
    max_results: int = Field(default=5, ge=1, le=8)
    trusted_only: bool = True

    @field_validator("query", "region")
    @classmethod
    def _strip_text(cls, v: str) -> str:
        return str(v or "").strip()


TAG_RE = re.compile(r"<[^>]+>")
FULL_DATE_RE = re.compile(r"(20\d{2})\D{0,4}(\d{1,2})\D{0,4}(\d{1,2})")
KOREAN_MONTH_DAY_RE = re.compile(r"(\d{1,2})\s*월\s*(\d{1,2})\s*일")
SLASH_MONTH_DAY_RE = re.compile(r"(?<!\d)(\d{1,2})[./-](\d{1,2})(?!\d)")


def clean_search_text(value: str) -> str:
    value = TAG_RE.sub(" ", value or "")
    value = html_lib.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def clip_calendar_title(query: str, index: int) -> str:
    base = re.sub(r"[^0-9A-Za-z가-힣 ]+", " ", query or "")
    words = [w for w in base.split() if w not in {"일정", "행사", "검색", "캘린더"}]
    title = "".join(words[:2]) or "AI일정"
    suffix = str(index)
    return (title[: max(1, TITLE_MAX_LEN - len(suffix))] + suffix)[:TITLE_MAX_LEN]


def last_day_of_month(year: int, month: int) -> int:
    if month == 12:
        return 31
    return (date(year, month + 1, 1) - timedelta(days=1)).day


def valid_month_date(year: int, month: int, day: int) -> str | None:
    try:
        parsed = date(year, month, day)
    except ValueError:
        return None
    return parsed.isoformat()


def is_trusted_domain(url: str) -> bool:
    parsed = urlparse(url)
    host = (parsed.netloc or "").lower().split(":")[0]
    if not host:
        return False
    return any(host == domain or host.endswith("." + domain) for domain in TRUSTED_SCHEDULE_DOMAINS)


def unwrap_search_url(href: str) -> str:
    href = html_lib.unescape(href or "")
    if href.startswith("//"):
        href = "https:" + href
    parsed = urlparse(href)
    query = parse_qs(parsed.query)
    if "uddg" in query and query["uddg"]:
        return unquote(query["uddg"][0])
    return href


def trusted_site_query() -> str:
    return " OR ".join(f"site:{domain}" for domain in TRUSTED_SCHEDULE_DOMAINS[:6])


def calendar_internet_available() -> bool:
    probes = [
        "https://date.nager.at/api/v3/AvailableCountries",
        "https://www.korea.kr",
        "https://duckduckgo.com/html/",
    ]
    for url in probes:
        try:
            res = requests.get(url, timeout=4, headers={"User-Agent": "dealer-dashboard/1.0"})
            if res.status_code < 500:
                return True
        except requests.RequestException:
            continue
    return False


def query_asks_public_holidays(query: str) -> bool:
    return any(keyword in query for keyword in HOLIDAY_KEYWORDS)


def fetch_korean_public_holidays(year: int) -> tuple[list[dict], str | None]:
    try:
        res = requests.get(
            f"https://date.nager.at/api/v3/PublicHolidays/{year}/KR",
            timeout=8,
            headers={"User-Agent": "dealer-dashboard/1.0"},
        )
        res.raise_for_status()
        data = res.json()
    except (requests.RequestException, ValueError) as exc:
        return [], str(exc)
    holidays = []
    for item in data if isinstance(data, list) else []:
        day = str(item.get("date") or "")
        name = str(item.get("localName") or item.get("name") or "공휴일")
        if day:
            holidays.append({"date": day, "title": name[:TITLE_MAX_LEN], "source": "date.nager.at"})
    return holidays, None


def fetch_schedule_search_results(query: str, max_results: int) -> tuple[list[dict], str | None]:
    try:
        search_text = f"{query} ({trusted_site_query()})"
        url = "https://duckduckgo.com/html/?" + urlencode({"q": search_text})
        res = requests.get(
            url,
            timeout=8,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) dealer-dashboard/1.0",
                "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.6",
            },
        )
        res.raise_for_status()
    except requests.RequestException as exc:
        return [], str(exc)

    results: list[dict] = []
    blocks = re.split(r'<div[^>]+class="[^"]*result[^"]*"', res.text)
    for block in blocks[1:]:
        title_match = re.search(r'class="result__a"[^>]*>(.*?)</a>', block, flags=re.S)
        snippet_match = re.search(r'class="result__snippet"[^>]*>(.*?)</(?:a|div)>', block, flags=re.S)
        href_match = re.search(r'href="([^"]+)"', title_match.group(0), flags=re.S) if title_match else None
        title = clean_search_text(title_match.group(1) if title_match else "")
        snippet = clean_search_text(snippet_match.group(1) if snippet_match else "")
        href = unwrap_search_url(href_match.group(1) if href_match else "")
        if (title or snippet) and is_trusted_domain(href):
            results.append({"title": title[:160], "snippet": snippet[:260], "url": href[:500]})
        if len(results) >= max_results:
            break
    return results, None


def extract_dates_from_search(payload: CalendarAiSearchRequest, results: list[dict]) -> list[str]:
    text = "\n".join(
        [payload.query, payload.region]
        + [f"{item.get('title', '')} {item.get('snippet', '')}" for item in results]
    )
    dates: list[str] = []
    seen = set()

    def add_date(value: str | None):
        if value and value not in seen:
            seen.add(value)
            dates.append(value)

    for y, m, d in FULL_DATE_RE.findall(text):
        y_i, m_i, d_i = int(y), int(m), int(d)
        if y_i == payload.year and m_i == payload.month:
            add_date(valid_month_date(y_i, m_i, d_i))
    for m, d in KOREAN_MONTH_DAY_RE.findall(text):
        m_i, d_i = int(m), int(d)
        if m_i == payload.month:
            add_date(valid_month_date(payload.year, m_i, d_i))
    for m, d in SLASH_MONTH_DAY_RE.findall(text):
        m_i, d_i = int(m), int(d)
        if m_i == payload.month:
            add_date(valid_month_date(payload.year, m_i, d_i))

    if dates:
        return dates[: payload.max_results]

    last_day = last_day_of_month(payload.year, payload.month)
    today = date.today()
    start_day = today.day if today.year == payload.year and today.month == payload.month else 1
    fallback_days = [start_day, min(last_day, start_day + 7), min(last_day, start_day + 14), min(last_day, start_day + 21)]
    for day in fallback_days:
        add_date(valid_month_date(payload.year, payload.month, max(1, day)))
    return dates[: payload.max_results]


def build_calendar_ai_entries(payload: CalendarAiSearchRequest, results: list[dict]) -> list[dict]:
    dates = extract_dates_from_search(payload, results)
    entries = []
    for index, entry_date in enumerate(dates, start=1):
        entries.append(
            {
                "id": uuid4().hex[:12],
                "date": entry_date,
                "title": clip_calendar_title(payload.query, index),
                "color": PRESET_COLORS[(index - 1) % len(PRESET_COLORS)],
                "source": "ai-search",
            }
        )
    return entries


def build_public_holiday_entries(payload: CalendarAiSearchRequest, holidays: list[dict]) -> list[dict]:
    entries = []
    for index, item in enumerate(holidays, start=1):
        try:
            holiday_date = datetime.strptime(item["date"], "%Y-%m-%d").date()
        except (KeyError, ValueError):
            continue
        if holiday_date.year != payload.year or holiday_date.month != payload.month:
            continue
        entries.append(
            {
                "id": uuid4().hex[:12],
                "date": holiday_date.isoformat(),
                "title": str(item.get("title") or "공휴일")[:TITLE_MAX_LEN],
                "color": "#dc2626",
                "source": item.get("source", "public-holiday"),
            }
        )
    return entries[: payload.max_results]


class OpenUrlRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def _validate_url(cls, v: str) -> str:
        parsed = urlparse(v.strip())
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise ValueError("only http(s) URLs are allowed")
        return v.strip()


class AIMatchRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    top_k: int = Field(default=3, ge=1, le=8)

    @field_validator("text")
    @classmethod
    def _validate_text(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("text is required")
        return v


class AIDemoRequest(BaseModel):
    prompt_id: str = Field(default="", max_length=80)
    title: str = Field(default="", max_length=200)
    summary: str = Field(default="", max_length=1000)
    output_sections: List[str] = Field(default_factory=list)
    inputs: dict = Field(default_factory=dict)
    extra_request: str = Field(default="", max_length=1000)

    @field_validator("output_sections")
    @classmethod
    def _validate_sections(cls, v: List[str]) -> List[str]:
        return [str(item).strip()[:120] for item in v if str(item).strip()][:12]

    @field_validator("inputs")
    @classmethod
    def _validate_inputs(cls, v: dict) -> dict:
        cleaned = {}
        for key, value in (v or {}).items():
            key = str(key).strip()[:80]
            if key:
                cleaned[key] = str(value).strip()[:1000]
        return cleaned


class AIPromptImproveRequest(BaseModel):
    prompt_id: str = Field(default="", max_length=80)
    title: str = Field(default="", max_length=200)
    summary: str = Field(default="", max_length=1000)
    base_prompt: str = Field(min_length=1, max_length=12000)
    inputs: dict = Field(default_factory=dict)
    extra_request: str = Field(default="", max_length=1200)

    @field_validator("base_prompt")
    @classmethod
    def _validate_base_prompt(cls, v: str) -> str:
        v = str(v or "").strip()
        if not v:
            raise ValueError("base_prompt is required")
        return v

    @field_validator("inputs")
    @classmethod
    def _validate_prompt_inputs(cls, v: dict) -> dict:
        cleaned = {}
        for key, value in (v or {}).items():
            key = str(key).strip()[:80]
            value = str(value).strip()[:1000]
            if key and value:
                cleaned[key] = value
        return cleaned


app = FastAPI(
    title="대리점장 통합 관리 대시보드",
    description="영업 통제부터 AI 활용 실무 스크립트 제작까지",
    version="1.2.0",
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    template = templates.env.get_template("index.html")
    html = template.render(request=request)
    local_ai_script = '<script src="/static/local_ai.js"></script>'
    if local_ai_script not in html:
        html = html.replace("</body>", f"    {local_ai_script}\n</body>")
    return HTMLResponse(html)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/generate")
async def generate(payload: dict):
    text = ""
    if isinstance(payload, dict):
        text = str(payload.get("text") or payload.get("prompt") or "").strip()
    if text:
        if not ai_manager.status().get("ready"):
            ai_manager.start_async()
            return JSONResponse(
                {
                    "status": "initializing",
                    "message": "로컬 AI 엔진을 준비하는 중입니다.",
                    "ai": ai_manager.status(),
                },
                status_code=202,
            )
        return JSONResponse({"status": "local-ai", "match": ai_manager.match(text)})

    return JSONResponse(
        {
            "status": "demo",
            "message": "정적 데모 모드입니다. 로컬 AI 추천은 /api/ai/match 엔드포인트를 사용합니다.",
            "received": payload,
        }
    )


@app.get("/api/ai/status")
async def api_ai_status():
    status = ai_manager.status()
    if status.get("state") == "idle":
        ai_manager.start_async()
        status = ai_manager.status()
    return status


@app.post("/api/ai/start")
async def api_ai_start():
    return ai_manager.start_async()


@app.get("/api/ai/templates")
async def api_ai_templates():
    return [{"id": item["id"], "title": item["title"]} for item in PROMPT_TEMPLATE_EXAMPLES]


@app.post("/api/ai/match")
async def api_ai_match(payload: AIMatchRequest):
    status = ai_manager.status()
    if not status.get("ready") and status.get("state") == "error":
        return ai_manager.match(payload.text, top_k=payload.top_k)
    if not status.get("ready"):
        ai_manager.start_async()
        raise HTTPException(
            status_code=409,
            detail={
                "message": "로컬 AI 엔진을 준비하는 중입니다.",
                "status": ai_manager.status(),
            },
        )
    try:
        return ai_manager.match(payload.text, top_k=payload.top_k)
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail={"message": str(exc), "status": ai_manager.status()})


@app.post("/api/ai/demo")
async def api_ai_demo(payload: AIDemoRequest):
    status = ai_manager.status()
    if not status.get("ready") and status.get("state") == "error":
        return ai_manager.preview_demo(
            prompt_id=payload.prompt_id,
            title=payload.title,
            summary=payload.summary,
            output_sections=payload.output_sections,
            inputs=payload.inputs,
            extra_request=payload.extra_request,
        )
    if not status.get("ready"):
        ai_manager.start_async()
        raise HTTPException(
            status_code=409,
            detail={
                "message": "로컬 AI 엔진을 준비하는 중입니다.",
                "status": ai_manager.status(),
            },
        )
    try:
        return ai_manager.compose_demo(
            prompt_id=payload.prompt_id,
            title=payload.title,
            summary=payload.summary,
            output_sections=payload.output_sections,
            inputs=payload.inputs,
            extra_request=payload.extra_request,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail={"message": str(exc), "status": ai_manager.status()})


@app.post("/api/ai/improve-prompt")
async def api_ai_improve_prompt(payload: AIPromptImproveRequest):
    status = ai_manager.status()
    if not status.get("ready"):
        ai_manager.start_async()
        raise HTTPException(
            status_code=409,
            detail={
                "message": "로컬 AI 엔진 준비가 끝난 뒤 프롬프트를 보강할 수 있습니다.",
                "status": ai_manager.status(),
            },
        )
    try:
        return ai_manager.improve_prompt(
            prompt_id=payload.prompt_id,
            title=payload.title,
            summary=payload.summary,
            base_prompt=payload.base_prompt,
            inputs=payload.inputs,
            extra_request=payload.extra_request,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail={"message": str(exc), "status": ai_manager.status()})


@app.get("/api/config")
async def api_get_config():
    return load_config()


@app.put("/api/config/notifications")
async def api_update_notifications(payload: NotificationSettings):
    cfg = load_config()
    cfg["notification_times"] = payload.notification_times
    if payload.notification_message:
        cfg["notification_message"] = payload.notification_message.strip()[:200]
    save_config(cfg)
    return cfg


@app.get("/api/shortcuts")
async def api_list_shortcuts():
    return load_config().get("shortcuts", [])


@app.post("/api/shortcuts")
async def api_create_shortcut(payload: ShortcutIn):
    cfg = load_config()
    item = {"id": uuid4().hex[:12], "name": payload.name, "url": payload.url}
    cfg.setdefault("shortcuts", []).append(item)
    save_config(cfg)
    return item


@app.put("/api/shortcuts/{shortcut_id}")
async def api_update_shortcut(shortcut_id: str, payload: ShortcutIn):
    cfg = load_config()
    for s in cfg.get("shortcuts", []):
        if s.get("id") == shortcut_id:
            s["name"] = payload.name
            s["url"] = payload.url
            save_config(cfg)
            return s
    raise HTTPException(status_code=404, detail="shortcut not found")


@app.delete("/api/shortcuts/{shortcut_id}")
async def api_delete_shortcut(shortcut_id: str):
    cfg = load_config()
    before = len(cfg.get("shortcuts", []))
    cfg["shortcuts"] = [s for s in cfg.get("shortcuts", []) if s.get("id") != shortcut_id]
    if len(cfg["shortcuts"]) == before:
        raise HTTPException(status_code=404, detail="shortcut not found")
    save_config(cfg)
    return {"status": "deleted", "id": shortcut_id}


@app.post("/api/open-url")
async def api_open_url(payload: OpenUrlRequest):
    webbrowser.open(payload.url, new=2)
    return {"status": "ok", "url": payload.url}


@app.get("/api/calendar/search-status")
def api_calendar_search_status():
    return {
        "internet_available": calendar_internet_available(),
        "trusted_domains": TRUSTED_SCHEDULE_DOMAINS,
    }


@app.post("/api/calendar/ai-search")
def api_calendar_ai_search(payload: CalendarAiSearchRequest):
    if not calendar_internet_available():
        raise HTTPException(
            status_code=503,
            detail={
                "message": "인터넷 연결이 없어 일정 검색 기능을 사용할 수 없습니다.",
                "internet_available": False,
            },
        )
    search_query = " ".join(
        part for part in [
            payload.query,
            payload.region,
            f"{payload.year}년 {payload.month}월",
            "행사 일정 프로모션",
        ] if part
    )
    sources: list[dict] = []
    search_error = None
    if query_asks_public_holidays(payload.query):
        holidays, holiday_error = fetch_korean_public_holidays(payload.year)
        suggestions = build_public_holiday_entries(payload, holidays)
        sources = [
            {
                "title": "South Korea public holidays",
                "snippet": f"{payload.year}년 대한민국 공휴일 구조화 데이터",
                "url": f"https://date.nager.at/api/v3/PublicHolidays/{payload.year}/KR",
            }
        ] if holidays else []
        search_error = holiday_error
    else:
        sources, search_error = fetch_schedule_search_results(search_query, payload.max_results)
        suggestions = build_calendar_ai_entries(payload, sources)

    cfg = load_config()
    entries = cfg.setdefault("calendar", [])
    created: list[dict] = []
    skipped: list[dict] = []
    for item in suggestions:
        same_day = [e for e in entries if e.get("date") == item["date"]]
        if len(same_day) >= MAX_PER_DAY:
            skipped.append({"date": item["date"], "reason": "day-limit"})
            continue
        entries.append(item)
        created.append(item)

    save_config(cfg)
    return {
        "status": "ok",
        "query": search_query,
        "created": created,
        "skipped": skipped,
        "sources": sources,
        "search_error": search_error,
        "trusted_domains": TRUSTED_SCHEDULE_DOMAINS,
        "message": (
            "신뢰 가능한 공휴일 데이터에서 선택한 월의 공휴일을 반영했습니다."
            if query_asks_public_holidays(payload.query) and created else
            "신뢰 사이트 검색 결과를 바탕으로 월간 일정에 반영했습니다."
            if created else
            "신뢰 사이트에서 선택한 월의 날짜 후보를 찾지 못했습니다."
        ),
    }


@app.get("/api/calendar/presets")
async def api_calendar_presets():
    return {"colors": PRESET_COLORS, "max_per_day": MAX_PER_DAY, "title_max_len": TITLE_MAX_LEN}


@app.get("/api/calendar")
async def api_list_calendar():
    return load_config().get("calendar", [])


@app.post("/api/calendar")
async def api_create_calendar(payload: CalendarEntryIn):
    cfg = load_config()
    entries = cfg.setdefault("calendar", [])
    same_day = [e for e in entries if e.get("date") == payload.date]
    if len(same_day) >= MAX_PER_DAY:
        raise HTTPException(
            status_code=400,
            detail=f"해당 일자에는 최대 {MAX_PER_DAY}개까지만 등록 가능합니다.",
        )
    item = {
        "id": uuid4().hex[:12],
        "date": payload.date,
        "title": payload.title,
        "color": payload.color,
    }
    entries.append(item)
    save_config(cfg)
    return item


@app.put("/api/calendar/{entry_id}")
async def api_update_calendar(entry_id: str, payload: CalendarEntryIn):
    cfg = load_config()
    entries = cfg.get("calendar", [])
    for entry in entries:
        if entry.get("id") == entry_id:
            if entry.get("date") != payload.date:
                same_day = [
                    e for e in entries
                    if e.get("date") == payload.date and e.get("id") != entry_id
                ]
                if len(same_day) >= MAX_PER_DAY:
                    raise HTTPException(
                        status_code=400,
                        detail=f"해당 일자에는 최대 {MAX_PER_DAY}개까지만 등록 가능합니다.",
                    )
            entry["date"] = payload.date
            entry["title"] = payload.title
            entry["color"] = payload.color
            save_config(cfg)
            return entry
    raise HTTPException(status_code=404, detail="calendar entry not found")


@app.delete("/api/calendar/{entry_id}")
async def api_delete_calendar(entry_id: str):
    cfg = load_config()
    entries = cfg.get("calendar", [])
    before = len(entries)
    cfg["calendar"] = [e for e in entries if e.get("id") != entry_id]
    if len(cfg["calendar"]) == before:
        raise HTTPException(status_code=404, detail="calendar entry not found")
    save_config(cfg)
    return {"status": "deleted", "id": entry_id}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("app:app", host=host, port=port, reload=False)
