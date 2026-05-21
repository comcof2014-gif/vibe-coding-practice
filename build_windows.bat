@echo off
REM Build dealer-dashboard.exe on Windows (Python 3.10+ recommended)
setlocal

where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not on PATH. Install Python 3.10+ and retry.
    exit /b 1
)

echo [1/4] Upgrading pip
python -m pip install --upgrade pip || goto :fail

echo [2/4] Installing project dependencies
python -m pip install -r requirements.txt || goto :fail

echo [3/4] Installing PyInstaller
python -m pip install "pyinstaller>=6.3" || goto :fail

echo [4/4] Building dealer-dashboard.exe (this can take 2-3 minutes)
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
python -m PyInstaller dealer_dashboard.spec --noconfirm || goto :fail

echo.
echo ===== BUILD SUCCESS =====
echo dist\dealer-dashboard.exe
echo.
exit /b 0

:fail
echo.
echo ===== BUILD FAILED =====
exit /b 1
