#!/bin/bash

# Wait for X server to be fully ready
sleep 10

# Set up environment
export DISPLAY=:1
export XAUTHORITY=/home/desktop/.Xauthority
export AGENT_HOST=0.0.0.0
export AGENT_PORT=8080

# For pyautogui to work without real display detection
export PYAUTOGUI_FAILSAFE=0

# Configure screenshot backends
export PYAUTOGUI_SCREENSHOT_BACKEND=scrot
export _PYAUTOGUI_XLIB_DISPLAY=:1

# Ensure scrot can work
export SCROT_OPTIONS="--quality 100"

# Create log file if it doesn't exist
touch /var/log/ai_agent.log 2>/dev/null || true
chmod 666 /var/log/ai_agent.log 2>/dev/null || true

# Test X11 connection
echo "Testing X11 connection..."
timeout 5 xset q > /dev/null 2>&1
X11_STATUS=$?

if [ $X11_STATUS -eq 0 ]; then
    echo "✓ X11 connection successful"
else
    echo "⚠ X11 connection test failed, but continuing..."
fi

echo "Starting AI agent server on port 8080..."
cd /opt/.ai_core

# Determine which Python file to run (compiled or source)
if [ -f "ai_agent_server.cpython-310.opt-1.pyc" ]; then
    echo "Using compiled Python bytecode"
    AGENT_SCRIPT="ai_agent_server.cpython-310.opt-1.pyc"
elif [ -f "ai_agent_server.py" ]; then
    echo "Using Python source file"
    AGENT_SCRIPT="ai_agent_server.py"
else
    echo "ERROR: No AI agent script found!"
    exit 1
fi

# Start the AI agent server
# Run without tee if permission issues, log internally
if [ -w /var/log/ai_agent.log ]; then
    echo "Logging to /var/log/ai_agent.log"
    python3 $AGENT_SCRIPT 2>&1 | tee -a /var/log/ai_agent.log
else
    echo "Cannot write to log file, running without file logging"
    python3 $AGENT_SCRIPT 2>&1
fi

# If the agent fails, keep trying
while [ $? -ne 0 ]; do
    echo "AI agent crashed, restarting in 5 seconds..."
    sleep 5
    if [ -w /var/log/ai_agent.log ]; then
        python3 $AGENT_SCRIPT 2>&1 | tee -a /var/log/ai_agent.log
    else
        python3 $AGENT_SCRIPT 2>&1
    fi
done