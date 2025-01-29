@echo off
setlocal enabledelayedexpansion

:: Set title and colors
title Document Analysis Tool
color 0A

:: Clear screen and show header
cls
echo ===================================
echo    Document Analysis Tool Launcher
echo ===================================
echo.

:: Create a temporary directory for logs
if not exist "logs" mkdir logs

:: Check if .env.local exists
if not exist ".env.local" (
    color 0C
    echo [X] Missing .env.local file!
    echo.
    echo Please create a .env.local file with your OpenRouter API key:
    echo OPENROUTER_API_KEY=your-api-key-here
    echo.
    echo Press any key to exit...
    pause > nul
    exit /b 1
)

:: Check if Node.js is installed
echo Checking Node.js installation...
node --version > logs\node_version.txt 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [X] Node.js is not installed!
    echo.
    echo Please download and install Node.js from https://nodejs.org/
    echo Make sure to install the LTS version.
    echo.
    echo Press any key to open the download page...
    pause > nul
    start https://nodejs.org/
    exit /b 1
)

:: Extract Node.js version
set /p NODE_VERSION=<logs\node_version.txt
echo [✓] Node.js %NODE_VERSION% is installed

:: Check if npm is installed
echo Checking npm installation...
call npm --version > logs\npm_version.txt 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [X] npm is not installed!
    echo Please reinstall Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Extract npm version
set /p NPM_VERSION=<logs\npm_version.txt
echo [✓] npm %NPM_VERSION% is installed

:: Check if dependencies are installed
if not exist "node_modules\" (
    echo Installing dependencies...
    echo This may take a few minutes...
    call npm install > logs\npm_install.txt 2>&1
    if %errorlevel% neq 0 (
        color 0C
        echo [X] Error installing dependencies!
        echo Check logs\npm_install.txt for details
        pause
        exit /b 1
    )
)

echo [✓] Dependencies are installed
echo.

:: Check if development server is already running on port 3000
echo Checking if server is already running...
netstat -ano | find "3000" > logs\port_check.txt
if %errorlevel% equ 0 (
    color 0C
    echo [X] The application is already running!
    echo Please close any existing instances first.
    echo Check logs\port_check.txt for details
    pause
    exit /b 1
)

:: Start the application
echo Starting Document Analysis Tool...
echo.
echo The application will open in your default browser automatically...
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.

:: Run the development server
npm run dev

endlocal 