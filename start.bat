@echo off
echo Starting Metatron Platform with Social Station Agent...
echo.

echo Starting Main App Frontend (Port 9001)...
start "Main App" cmd /k "cd frontend && python serve.py"

echo Waiting for frontend to start...
timeout /t 3 /nobreak > nul

echo Starting Social Station Agent API (Port 8082)...
start "Social Station Agent" cmd /k "cd backend && python social_station_api.py"

echo.
echo ✅ Metatron Platform Started!
echo 🌐 Main App: http://localhost:9001
echo 🤖 Social Station Agent API: http://localhost:8082/api/social-agent/
echo.
echo 📱 Features Available:
echo   - Click Social Station button in main app
echo   - Chat with Social Agent for natural language commands
echo   - Real social media posting through Composio
echo   - Scheduling, analytics, and platform management
echo.
echo 🔑 Make sure to set your COMPOSIO_API_KEY in backend/.env
echo.
echo Press any key to exit...
pause > nul
