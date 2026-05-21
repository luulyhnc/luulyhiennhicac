@echo off
chcp 65001 >nul
title Deploy Web Truyen
color 0A

echo.
echo ===================================================
echo   DEPLOY WEB TRUYEN - GITHUB PAGES MIEN PHI
echo ===================================================
echo.

:: Kiem tra Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [LOI] Chua cai Git. Tai tai: https://git-scm.com
    start https://git-scm.com/download/win
    pause & exit /b
)
echo [OK] Git san sang.
echo.

:: BUOC 1 - Nhap ten GitHub
echo BUOC 1: Nhap ten dang nhap GitHub cua ban
echo (Chua co tai khoan? Mien phi tai: https://github.com/signup)
echo.
set /p GITHUB_USER=Ten GitHub:
if "%GITHUB_USER%"=="" (
    echo [LOI] Ten GitHub khong duoc de trong!
    pause & exit /b
)
set REPO_NAME=web-truyen

:: BUOC 2 - Mo trang tao repo
echo.
echo ===================================================
echo BUOC 2: Tao repo tren GitHub
echo ===================================================
echo.
echo Trinh duyet se mo trang tao repo GitHub...
echo.
echo Lam theo cac buoc sau:
echo   1. Dat ten repo la: web-truyen
echo   2. Chon: Public
echo   3. KHONG tick "Add a README file"
echo   4. Nhan nut "Create repository" (mau xanh)
echo.
timeout /t 3 /nobreak >nul
start https://github.com/new?name=web-truyen^&visibility=public
echo.
echo Sau khi tao xong repo, quay lai day va...
pause

:: BUOC 3 - Cau hinh git va push
echo.
echo BUOC 3: Dang day code len GitHub...
echo.

cd /d C:\web-truyen

git config user.email "%GITHUB_USER%@users.noreply.github.com"
git config user.name "%GITHUB_USER%"

git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git

git add -A
git commit -m "Deploy TruyenHub" --allow-empty 2>nul

echo.
echo Dang push code... (Trinh duyet co the mo de ban dang nhap GitHub)
echo.
git branch -M main
git push -u origin main

if errorlevel 1 (
    echo.
    echo ===================================================
    echo [LOI] Push that bai! Nguyen nhan co the la:
    echo.
    echo   1. Chua tao repo tren GitHub
    echo      -> Vao: https://github.com/new
    echo      -> Ten repo: web-truyen, chon Public
    echo.
    echo   2. Sai ten dang nhap GitHub
    echo      -> Ban nhap: %GITHUB_USER%
    echo      -> Kiem tra lai tai: https://github.com
    echo.
    echo   3. Chua dang nhap GitHub trong trinh duyet
    echo      -> Dang nhap tai: https://github.com/login
    echo      -> Roi chay lai file nay
    echo ===================================================
    echo.
    pause & exit /b
)

:: BUOC 4 - Bat GitHub Pages
echo.
echo BUOC 4: Bat GitHub Pages...
echo.
echo Trinh duyet se mo trang Settings...
echo.
echo Lam theo:
echo   1. Keo xuong muc "Build and deployment"
echo   2. Source: chon "GitHub Actions"
echo   3. Nhan Save (neu co)
echo.
timeout /t 2 /nobreak >nul
start https://github.com/%GITHUB_USER%/%REPO_NAME%/settings/pages

echo.
echo ===================================================
echo.
echo   HOAN TAT! Web cua ban:
echo.
echo   https://%GITHUB_USER%.github.io/web-truyen/
echo.
echo   (Cho 1-2 phut de GitHub build xong)
echo.
echo   Xem tien trinh build tai:
echo   https://github.com/%GITHUB_USER%/%REPO_NAME%/actions
echo.
timeout /t 3 /nobreak >nul
start https://github.com/%GITHUB_USER%/%REPO_NAME%/actions
echo ===================================================
echo.
echo   CAP NHAT TRUYEN SAU NAY:
echo   - Sua file: C:\web-truyen\data\stories.json
echo   - Chay lai file DEPLOY.bat
echo   - Web tu dong cap nhat trong 1 phut
echo.
pause
