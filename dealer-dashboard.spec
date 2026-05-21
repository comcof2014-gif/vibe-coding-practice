# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs, collect_submodules


block_cipher = None

hiddenimports = [
    "ai_engine",
    "app",
    "desktop",
    "fastapi",
    "jinja2",
    "llama_cpp",
    "llama_cpp.llama_cpp",
    "PIL",
    "PIL.Image",
    "PIL.ImageDraw",
    "pystray",
    "requests",
    "uvicorn",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan.on",
    "webview",
]
hiddenimports += collect_submodules("llama_cpp")

datas = [
    ("templates", "templates"),
    ("static", "static"),
]
datas += collect_data_files("llama_cpp")

binaries = []
binaries += collect_dynamic_libs("llama_cpp")

a = Analysis(
    ["desktop.py"],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["torch", "transformers"],
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
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
