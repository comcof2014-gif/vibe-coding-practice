"""
Windows desktop wrapper for the 대리점장 대시보드.

- Runs the FastAPI app on localhost in a background thread.
- Opens a native window via pywebview pointing at the local server.
- Closing the window hides it to the system tray; quit only via tray menu.
- A scheduler thread fires custom tkinter popup notifications at configured times.
"""

from __future__ import annotations

import queue
import socket
import sys
import threading
import time
import tkinter as tk
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


HOST = "127.0.0.1"
APP_TITLE = "대리점장 통합 관리 대시보드"

POPUP_W = 360
POPUP_H = 150
POPUP_MARGIN_X = 24
POPUP_MARGIN_Y = 60
POPUP_GAP = 12
POPUP_DURATION_MS = 12000


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


class PopupManager:
    """Single tkinter thread that owns one hidden root and spawns Toplevel popups."""

    def __init__(self, on_click=None) -> None:
        self._queue: "queue.Queue[tuple[str, str]]" = queue.Queue()
        self._thread: threading.Thread | None = None
        self._root: tk.Tk | None = None
        self._active: list[tk.Toplevel] = []
        self._on_click = on_click

    def start(self) -> None:
        self._thread = threading.Thread(target=self._run, daemon=True, name="popup-tk")
        self._thread.start()

    def show(self, title: str, message: str) -> None:
        self._queue.put((title, message))

    def _run(self) -> None:
        self._root = tk.Tk()
        self._root.withdraw()
        self._poll()
        self._root.mainloop()

    def _poll(self) -> None:
        assert self._root is not None
        try:
            while True:
                title, message = self._queue.get_nowait()
                self._spawn(title, message)
        except queue.Empty:
            pass
        self._root.after(200, self._poll)

    def _next_position(self) -> tuple[int, int]:
        assert self._root is not None
        sw = self._root.winfo_screenwidth()
        sh = self._root.winfo_screenheight()
        index = len([w for w in self._active if w.winfo_exists()])
        x = sw - POPUP_W - POPUP_MARGIN_X
        y = sh - POPUP_MARGIN_Y - (POPUP_H + POPUP_GAP) * (index + 1)
        if y < 40:
            y = 40
        return x, y

    def _spawn(self, title: str, message: str) -> None:
        assert self._root is not None
        win = tk.Toplevel(self._root)
        win.overrideredirect(True)
        win.attributes("-topmost", True)
        try:
            win.attributes("-alpha", 0.97)
        except tk.TclError:
            pass

        x, y = self._next_position()
        win.geometry(f"{POPUP_W}x{POPUP_H}+{x}+{y}")
        win.configure(bg="#0369a1")

        header = tk.Frame(win, bg="#0369a1", height=38)
        header.pack(fill="x")
        header.pack_propagate(False)
        tk.Label(
            header,
            text=f"🔔  {title}",
            fg="white",
            bg="#0369a1",
            font=("Malgun Gothic", 11, "bold"),
        ).pack(side="left", padx=14)
        close_lbl = tk.Label(
            header,
            text="✕",
            fg="white",
            bg="#0369a1",
            font=("Malgun Gothic", 12, "bold"),
            cursor="hand2",
        )
        close_lbl.pack(side="right", padx=14)
        close_lbl.bind("<Button-1>", lambda _e: self._dismiss(win))

        body = tk.Frame(win, bg="white", highlightthickness=0)
        body.pack(fill="both", expand=True)
        msg_lbl = tk.Label(
            body,
            text=message,
            fg="#1c1917",
            bg="white",
            font=("Malgun Gothic", 10),
            wraplength=POPUP_W - 36,
            justify="left",
            anchor="nw",
            cursor="hand2",
        )
        msg_lbl.pack(fill="both", expand=True, padx=18, pady=14)

        if self._on_click is not None:
            for w in (body, msg_lbl):
                w.bind("<Button-1>", lambda _e: (self._on_click(), self._dismiss(win)))

        def _start_drag(e: tk.Event) -> None:
            win._dx, win._dy = e.x, e.y  # type: ignore[attr-defined]

        def _do_drag(e: tk.Event) -> None:
            nx = win.winfo_x() + e.x - win._dx  # type: ignore[attr-defined]
            ny = win.winfo_y() + e.y - win._dy  # type: ignore[attr-defined]
            win.geometry(f"+{nx}+{ny}")

        header.bind("<Button-1>", _start_drag)
        header.bind("<B1-Motion>", _do_drag)

        self._active.append(win)
        win.after(POPUP_DURATION_MS, lambda: self._dismiss(win))

    def _dismiss(self, win: tk.Toplevel) -> None:
        try:
            if win.winfo_exists():
                win.destroy()
        except Exception:
            pass
        self._active = [w for w in self._active if w is not win]


class DesktopApp:
    def __init__(self) -> None:
        self.port = _pick_free_port()
        self.window: "webview.Window | None" = None
        self.tray: "pystray.Icon | None" = None
        self.popup: PopupManager | None = None
        self._quitting = threading.Event()
        self._last_fired_key: str | None = None

    def server_url(self) -> str:
        return f"http://{HOST}:{self.port}/"

    def _notify(self, title: str, message: str) -> None:
        if self.popup is not None:
            self.popup.show(title, message)

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

    def _tray_notify_test(self, _icon=None, _item=None) -> None:
        self._notify(APP_TITLE, "테스트 알림입니다. 알림이 정상 동작합니다 ✅")

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
            pystray.MenuItem("알림 테스트", self._tray_notify_test),
            pystray.MenuItem("종료", self._tray_quit),
        )
        return pystray.Icon("dealer-dashboard", _make_tray_icon_image(), APP_TITLE, menu)

    def run(self) -> None:
        server_thread = threading.Thread(target=_start_server, args=(self.port,), daemon=True)
        server_thread.start()

        if not _wait_for_server(self.port):
            print("Failed to start local server", file=sys.stderr)
            sys.exit(1)

        self.popup = PopupManager(on_click=self._tray_show)
        self.popup.start()

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
