@echo off
chcp 65001 >nul
echo ================================================
echo   HUONG DAN DEPLOY WEB TRUYEN LEN GITHUB PAGES
echo ================================================
echo.

set /p GITHUB_USER=Nhap ten GitHub cua ban (vi du: nguyenvana):
set /p REPO_NAME=Nhap ten repo (de mac dinh: web-truyen):
if "%REPO_NAME%"=="" set REPO_NAME=web-truyen

echo.
echo [1] Dang cau hinh git...
git config user.email "%GITHUB_USER%@users.noreply.github.com"
git config user.name "%GITHUB_USER%"

echo [2] Them remote GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git

echo [3] Commit cac file moi (neu co)...
git add .
git commit -m "Update website" 2>nul

echo [4] Push len GitHub...
git branch -M main
git push -u origin main

echo.
echo ================================================
echo XONG! Tiep theo:
echo  1. Vao https://github.com/%GITHUB_USER%/%REPO_NAME%/settings/pages
echo  2. Source: chon "GitHub Actions"
echo  3. Web ban se co tai:
echo     https://%GITHUB_USER%.github.io/%REPO_NAME%/
echo ================================================
echo.
pause
