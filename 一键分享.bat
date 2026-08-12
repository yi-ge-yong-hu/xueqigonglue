@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo   《学期攻略》公网临时分享器
echo   启动后保持本窗口/电脑开启即可, 链接见"当前链接.txt"
echo   隧道异常时自动重连, 链接会更新
echo ============================================================
echo.
start "semester-server" /min cmd /c "node server.js"
timeout /t 2 /nobreak >nul
node keep_tunnel.js
pause