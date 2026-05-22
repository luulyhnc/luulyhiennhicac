@echo off
chcp 65001 >nul
color 0A
title Push code len GitHub

echo.
echo ===================================================
echo   DANG PUSH CODE LEN GITHUB...
echo ===================================================
echo.

cd /d C:\web-truyen

git config user.email "luulyhnc@users.noreply.github.com"
git config user.name "luulyhnc"

git remote remove origin 2>nul
git remote add origin https://github.com/luulyhnc/luulyhiennhicac.git
git branch -M main

echo Trinh duyet se mo de ban dang nhap GitHub...
echo Dang nhap bang tai khoan: luulyhnc
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo [LOI] Push that bai!
    echo - Kiem tra da dang nhap dung tai khoan: luulyhnc
    echo - Neu bi hoi mat khau, dung mat khau GitHub
    pause & exit /b
)

echo.
echo ===================================================
echo   PUSH THANH CONG!
echo ===================================================
echo.
echo Buoc tiep - Bat GitHub Pages:
echo.
timeout /t 2 /nobreak >nul
start "" "https://github.com/luulyhnc/luulyhiennhicac/settings/pages"
echo Trinh duyet vua mo Settings/Pages
echo - Keo xuong "Build and deployment"
echo - Source: chon "GitHub Actions"
echo - Nhan Save
echo.
echo   WEB CUA BAN:
echo   https://luulyhnc.github.io/luulyhiennhicac/
echo.
pause
