@echo off
REM Automatic update script for Dietologist GitHub Pages (Windows)

setlocal enabledelayedexpansion

set SOURCE=C:\Users\steph\OneDrive\Desktop\Dietologist.html
set REPO=%USERPROFILE%\feedyourhealth.github.io
set INDEX=%REPO%\index.html

echo 🔄 Dietologist - Update to GitHub
echo ==================================

REM Check if source file exists
if not exist "%SOURCE%" (
    echo ❌ Error: Dietologist.html not found at %SOURCE%
    exit /b 1
)

REM Copy updated file
echo 📋 Copying updated Dietologist.html...
copy "%SOURCE%" "%INDEX%" >nul

REM Navigate to repo
cd /d "%REPO%"

REM Check git status and commit
echo 📊 Checking for changes...
git status --porcelain | findstr /c:"index.html" >nul

if errorlevel 1 (
    echo ✅ No changes to commit
    exit /b 0
)

REM Stage and commit
git add index.html

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a:%%b)

git commit -m "Update Dietologist app - %mydate% %mytime%"

REM Push to GitHub
echo 📤 Pushing to GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ Success! App updated and live at:
    echo    https://feedyourhealth.github.io
    echo.
) else (
    echo ❌ Push failed. Make sure:
    echo    1. You've authenticated with GitHub
    echo    2. The remote is configured: git remote -v
    echo    3. The branch is 'main': git branch
)

pause
