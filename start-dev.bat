@echo off
echo Starting Nefty-Trade Application...

echo.
echo Starting backend on port 5000...
cd nifty-backend
start "Backend" cmd /k "npm start"

echo.
echo Starting frontend on port 8080...
cd ..\nifty-play-studio
start "Frontend" cmd /k "npm run dev"

echo.
echo ✅ Backend running on: http://localhost:5000
echo ✅ Frontend running on: http://localhost:8080
echo ✅ API Health check: http://localhost:5000/health
echo.
echo Both services started in separate windows
echo Close the terminal windows to stop the services
pause