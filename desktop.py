"""
Windows desktop wrapper for the 대리점장 대시보드.

- Runs the FastAPI app on localhost in a background thread.
- Opens a native window via pywebview pointing at the local server.
- Closing the window hides it to the system tray; quit only via tray menu.
- A scheduler thread fires Windows toast notifications at configured times.
"""

from __future__ import annotations

import socket
import sys
import threading
import time
from datetime import datetime
from pathlib import Path

import uvicorn

from app import app, BASE_DIR, load_config

try:
    import webview
except ImportError:
    print("pywebview is required. Run: pip install -r requirements.txt", file=sys.stderr)
    raise

try:
    import pystray
    from PIL import Image, ImageDraw
except ImportError:
    print("pystray + Pillow are required. Run: pip install -r requirements.txt", file=sys.stderr)
    raise

try:
    from plyer import notification as plyer_notification
except ImportError:
    plyer_notification = None


HOST = "127.0.0.1"
APP_TITLE = "대리점장 통합 관리 대시보드"


def _pick_free_port(default: int = 8765) -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind((HOST, default))
            return default
        except OSError:
            s.bind((HOST, 0))
            return s.getsockname()[1]


def _start_server(port: int) -> None:
    config = uvicorn.Config(app, host=HOST, port=port, log_level="warning", access_log=False)
    server = uvicorn.Server(config)
    server.run()


def _wait_for_server(port: int, timeout: float = 10.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection((HOST, port), timeout=0.5):
                return True
        except OSError:
            time.sleep(0.1)
    return False


def _make_tray_icon_image() -> "Image.Image":
    icon_path = BASE_DIR / "static" / "tray.png"
    if icon_path.exists():
        return Image.open(icon_path)
    img = Image.new("RGBA", (64, 64), (3, 105, 161, 255))
    d = ImageDraw.Draw(img)
    d.rectangle((10, 12, 54, 52), fill=(255, 255, 255, 255))
    d.line((18, 24, 46, 24), fill=(3, 105, 161, 255), width=3)
    d.line((18, 34, 46, 34), fill=(3, 105, 161, 255), width=3)
    d.line((18, 44, 36, 44), fill=(3, 105, 161, 255), width=3)
    return img


class DesktopApp:
    def __init__(self) -> None:
        self.port = _pick_free_port()
        self.window: "webview.Window | None" = None
        self.tray: "pystray.Icon | None" = None
        self._quitting = threading.Event()
        self._last_fired_key: str | None = None

    def server_url(self) -> str:
        return f"http://{HOST}:{self.port}/"

    def _notify(self, title: str, message: str) -> None:
        if plyer_notification is None:
            return
        try:
            plyer_notification.notify(title=title, message=message, app_name=APP_TITLE, timeout=10)
        except Exception:
            pass

    def _scheduler_loop(self) -> None:
        while not self._quitting.is_set():
            try:
                cfg = load_config()
                times = cfg.get("notification_times", [])
                msg = cfg.get("notification_message") or "오늘의 일일 체크리스트를 확인하세요."
                now = datetime.now()
                key = now.strftime("%Y-%m-%d %H:%M")
                hhmm = now.strftime("%H:%M")
                if hhmm in times and key != self._last_fired_key:
                    self._last_fired_key = key
                    self._notify(APP_TITLE, msg)
                    if self.window is not None:
                        try:
                            self.window.show()
                        except Exception:
                            pass
            except Exception:
                pass
            self._quitting.wait(20)

    def _on_window_closing(self) -> bool:
        if self._quitting.is_set():
            return True
        if self.window is not None:
            try:
                self.window.hide()
            except Exception:
                pass
        return False

    def _tray_show(self, _icon=None, _item=None) -> None:
        if self.window is None:
            return
        try:
            self.window.show()
        except Exception:
            pass

    def _tray_quit(self, icon=None, _item=None) -> None:
        self._quitting.set()
        try:
            if icon is not None:
                icon.stop()
            elif self.tray is not None:
                self.tray.stop()
        except Exception:
            pass
        try:
            if self.window is not None:
                self.window.destroy()
        except Exception:
            pass

    def _build_tray(self) -> "pystray.Icon":
        menu = pystray.Menu(
            pystray.MenuItem("열기", self._tray_show, default=True),
            pystray.MenuItem("종료", self._tray_quit),
        )
        return pystray.Icon("dealer-dashboard", _make_tray_icon_image(), APP_TITLE, menu)

    def run(self) -> None:
        server_thread = threading.Thread(target=_start_server, args=(self.port,), daemon=True)
        server_thread.start()

        if not _wait_for_server(self.port):
            print("Failed to start local server", file=sys.stderr)
            sys.exit(1)

        scheduler_thread = threading.Thread(target=self._scheduler_loop, daemon=True)
        scheduler_thread.start()

        self.tray = self._build_tray()
        tray_thread = threading.Thread(target=self.tray.run, daemon=True)
        tray_thread.start()

        self.window = webview.create_window(
            APP_TITLE,
            self.server_url(),
            width=1280,
            height=860,
            min_size=(1024, 720),
        )
        self.window.events.closing += self._on_window_closing
        webview.start()

        self._tray_quit()


if __name__ == "__main__":
    DesktopApp().run()
