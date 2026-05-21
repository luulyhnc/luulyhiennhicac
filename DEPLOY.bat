@echo off
chcp 65001 >nul
title TruyenHub - Deploy len GitHub Pages (Mien phi mai mai)
color 0A

echo.
echo  ████████╗██████╗ ██╗   ██╗███████╗███╗  ██╗
echo  ╚══██╔══╝██╔══██╗██║   ██║██╔════╝████╗ ██║
echo     ██║   ██████╔╝██║   ██║█████╗  ██╔██╗██║
echo     ██║   ██╔══██╗██║   ██║██╔══╝  ██║╚████║
echo     ██║   ██║  ██║╚██████╔╝███████╗██║ ╚███║
echo     ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚══╝
echo.
echo  [DEPLOY WEB TRUYEN - GITHUB PAGES MIEN PHI]
echo  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: ── BUOC 1: Kiem tra Git ──────────────────────────
git --version >nul 2>&1
if errorlevel 1 (
  echo  [LOI] Git chua duoc cai dat.
  echo  Tai Git tai: https://git-scm.com/download/win
  start https://git-scm.com/download/win
  pause & exit
)
echo  [OK] Git da san sang.
echo.

:: ── BUOC 2: Thong tin nguoi dung ─────────────────
echo  BUOC 1/4 - Nhap thong tin GitHub
echo  ─────────────────────────────────
echo  (Chua co tai khoan? Mien phi tai: https://github.com/signup)
echo.
set /p GITHUB_USER= Ten dang nhap GitHub cua ban:
if "%GITHUB_USER%"=="" (echo  [LOI] Khong duoc de trong! & pause & exit)

set REPO_NAME=web-truyen
echo.
echo  Repository se tao: github.com/%GITHUB_USER%/%REPO_NAME%
echo.

:: ── BUOC 3: Mo trang tao repo ────────────────────
echo  BUOC 2/4 - Tao repository tren GitHub
echo  ─────────────────────────────────────
echo  Trinh duyet se mo trang tao repo...
echo  Hay lam theo:
echo    1. Dat ten repo la: %REPO_NAME%
echo    2. Chon "Public"
echo    3. KHONG tick "Add README"
echo    4. Nhan "Create repository"
echo.
timeout /t 2 >nul
start https://github.com/new?name=%REPO_NAME%^&visibility=public
echo.
pause "Sau khi tao xong repo, nhan phim bat ky de tiep tuc..."

:: ── BUOC 4: Push code ────────────────────────────
echo.
echo  BUOC 3/4 - Dang day code len GitHub...
echo  ─────────────────────────────────────
cd /d C:\web-truyen

git config user.email "%GITHUB_USER%@users.noreply.github.com"
git config user.name "%GITHUB_USER%"

git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git

git add -A
git commit -m "Deploy TruyenHub website" --allow-empty

git branch -M main

echo.
echo  [Trinh duyet se mo de ban dang nhap GitHub - chi can lam 1 lan]
git push -u origin main

if errorlevel 1 (
  echo.
  echo  [LOI] Push that bai. Hay kiem tra lai ten GitHub va repo.
  pause & exit
)

:: ── BUOC 5: Bat GitHub Pages ─────────────────────
echo.
echo  BUOC 4/4 - Bat GitHub Pages
echo  ─────────────────────────────
echo  Trinh duyet se mo trang Settings...
echo  Hay lam:
echo    1. Keo xuong muc "Source"
echo    2. Chon "GitHub Actions"
echo    3. Nhan Save
echo.
timeout /t 2 >nul
start https://github.com/%GITHUB_USER%/%REPO_NAME%/settings/pages

echo.
echo  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo   HOAN TAT! Web cua ban se song tai:
echo.
echo   https://%GITHUB_USER%.github.io/%REPO_NAME%/
echo.
echo   (Cho 1-2 phut de GitHub build xong)
echo.
echo   Kiem tra tien trinh build tai:
start https://github.com/%GITHUB_USER%/%REPO_NAME%/actions
echo   https://github.com/%GITHUB_USER%/%REPO_NAME%/actions
echo.
echo  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo   CAP NHAT TRUYEN SAU NAY:
echo   - Sua file C:\web-truyen\data\stories.json
echo   - Chay lai file DEPLOY.bat nay
echo   - Web tu dong cap nhat trong 1 phut
echo.
pause
