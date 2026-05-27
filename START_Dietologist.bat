@echo off
REM Start HTTP Server for Dietologist with Dietologist.html
cd /d "C:\Users\steph\OneDrive\Desktop"
echo Iniciando Dietologist Server...
echo Abrindo http://localhost:7788/Dietologist.html
start "" http://localhost:7788/Dietologist.html
python -m http.server 7788 --directory "C:\Users\steph\OneDrive\Desktop"
