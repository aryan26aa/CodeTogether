@echo off
echo Starting CodeCast - Professional Collaborative Coding Platform
echo.

echo Starting Server...
start "CodeCast Server" cmd /k "cd server && npm start"

echo Waiting for server to start...
timeout /t 3 /nobreak > nul

echo Starting Client...
start "CodeCast Client" cmd /k "cd client && npm start"

echo.
echo CodeCast is starting up!
echo Server: http://localhost:5000
echo Client: http://localhost:3000
echo.
echo Press any key to exit this launcher...
pause > nul 