import json
import os
import re
import sys
import threading
import webbrowser
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field, field_validator


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


class OpenUrlRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def _validate_url(cls, v: str) -> str:
        parsed = urlparse(v.strip())
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise ValueError("only http(s) URLs are allowed")
        return v.strip()


app = FastAPI(
    title="대리점장 통합 관리 대시보드",
    description="영업 통제부터 AI 활용 실무 스크립트 제작까지",
    version="1.1.0",
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/generate")
async def generate(payload: dict):
    return JSONResponse(
        {
            "status": "demo",
            "message": "정적 데모 모드입니다. AI API 연동은 추후 확장 예정입니다.",
            "received": payload,
        }
    )


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
