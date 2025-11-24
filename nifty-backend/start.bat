@echo off
echo 🚀 Starting Nifty Trading Backend...
echo.

REM Check if MongoDB is running
echo 📊 Checking MongoDB connection...
timeout /t 2 /nobreak > nul

REM Check if Node.js is installed
node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist package.json (
    echo ❌ package.json not found
    echo Please run this script from the backend directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env file exists, if not copy from example
if not exist .env (
    echo 📝 Creating .env file from example...
    copy .env.example .env
    echo ⚠️  Please edit .env file with your configuration
)

echo ✅ Starting server...
echo 📡 Backend will be available at: http://localhost:5000
echo 🩺 Health check at: http://localhost:5000/health
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
npm run dev