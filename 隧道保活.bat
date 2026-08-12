@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo   《学期攻略》公网隧道 - 自动保活器
echo   隧道断开时本脚本会自动重连, 新链接即时更新到"当前链接.txt"
echo   关闭本窗口 = 停止服务
echo ============================================================
echo.

if exist "%~dp0当前链接.txt" del "%~dp0当前链接.txt"

:loop
echo.
echo [%date% %time%] 检查本地服务器 (8123)...
curl -s -o nul -m 5 http://localhost:8123/ || (
    echo  服务器未启动, 正在启动...
    start "semester-server" /min cmd /c "node server.js"
    timeout /t 2 /nobreak >nul
)

echo [%date% %time%] 检查隧道...
set URL=
for /f "delims=" %%L in ('ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile="%~dp0kh_file" -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -R 80:localhost:8123 nokey@localhost.run 2^>^&1 ^| findstr /C:"lhr.life"') do (
    set URL=%%L
)

if defined URL (
    echo.
    echo  ^>^>^>  当前公网链接: https://%URL%
    echo.
    echo https://%URL% > "%~dp0当前链接.txt"
    echo 已写入 当前链接.txt   (正在等待隧道断开...)
) else (
    echo  重连失败, 10秒后重试
)

timeout /t 10 /nobreak >nul
goto loop