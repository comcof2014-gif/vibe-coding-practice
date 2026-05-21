# PyInstaller spec for 대리점장 통합 관리 대시보드 (Windows desktop build)
# Usage: pyinstaller dealer_dashboard.spec
import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw

block_cipher = None
ROOT = Path(os.path.abspath(SPECPATH))
ICON_PATH = ROOT / "build" / "dealer-dashboard.ico"


def _ensure_icon() -> Path:
    ICON_PATH.parent.mkdir(parents=True, exist_ok=True)
    if ICON_PATH.exists():
        return ICON_PATH
    img = Image.new("RGBA", (256, 256), (3, 105, 161, 255))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((36, 44, 220, 212), radius=18, fill=(255, 255, 255, 255))
    for y in (88, 132, 176):
        d.rectangle((72, y, 200, y + 14), fill=(3, 105, 161, 255))
    d.ellipse((58, 84, 80, 106), outline=(3, 105, 161, 255), width=4)
    d.ellipse((58, 128, 80, 150), outline=(3, 105, 161, 255), width=4)
    d.ellipse((58, 172, 80, 194), outline=(3, 105, 161, 255), width=4)
    img.save(
        ICON_PATH,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    return ICON_PATH


icon_file = _ensure_icon()

datas = [
    (str(ROOT / "templates"), "templates"),
    (str(ROOT / "static"), "static"),
]

hiddenimports = [
    "plyer.platforms.win.notification",
    "pystray._win32",
    "PIL._tkinter_finder",
    "uvicorn.logging",
    "uvicorn.loops.auto",
    "uvicorn.loops.asyncio",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.http.h11_impl",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.protocols.websockets.websockets_impl",
    "uvicorn.lifespan.on",
    "webview.platforms.edgechromium",
    "webview.platforms.winforms",
    "webview.platforms.mshtml",
    "clr",
]

a = Analysis(
    ["desktop.py"],
    pathex=[str(ROOT)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="dealer-dashboard",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(icon_file),
)
