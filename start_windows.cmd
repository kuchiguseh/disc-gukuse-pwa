@echo off
title DISC別口ぐせ診断 - ローカルサーバ起動
echo ===============================================
echo  DISC別口ぐせ診断 ローカルサーバを起動します
echo  ブラウザで http://localhost:8080/ を開いてください
echo  終了はこのウィンドウで Ctrl + C
echo ===============================================
cd /d "%~dp0"
where python >nul 2>&1 && python -m http.server 8080 && goto :eof
where python3 >nul 2>&1 && python3 -m http.server 8080 && goto :eof
echo [エラー] Pythonが見つかりません。Microsoft Store から Python 3 をインストールして再実行してください。
pause
