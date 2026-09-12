@echo off
setlocal
cd /d "%~dp0"

set "PYTHON_CMD=python"
python -c "import sys; raise SystemExit(sys.version_info < (3, 10))" >nul 2>nul
if errorlevel 1 set "PYTHON_CMD=py -3"

%PYTHON_CMD% -c "import sys; raise SystemExit(sys.version_info < (3, 10))" >nul 2>nul
if errorlevel 1 (
    echo Python 3 was not found. Install Python 3.10 or newer from https://python.org/
    pause
    exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
    echo Creating Python environment...
    %PYTHON_CMD% -m venv .venv
    if errorlevel 1 goto :error
)

".venv\Scripts\python.exe" -c "import PIL, bs4, requests, Crypto; from yt_dlp.version import __version__; assert tuple(map(int, __version__.split('.')[:3])) >= (2026, 8, 19)" >nul 2>nul
if errorlevel 1 (
    echo Installing GUI dependencies...
    ".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -r requirements.txt
    if errorlevel 1 goto :error
)

".venv\Scripts\python.exe" -m desktop_gui --check >nul
if errorlevel 1 goto :error

if /i "%~1"=="--check" (
    ".venv\Scripts\python.exe" -m desktop_gui --check
    exit /b %errorlevel%
)

start "" ".venv\Scripts\pythonw.exe" -m desktop_gui
exit /b 0

:error
echo Failed to prepare the GUI.
pause
exit /b 1
