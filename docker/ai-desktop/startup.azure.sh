#!/bin/bash
# Azure-optimized startup script with better error handling and keep-alive

set -e  # Exit on error during setup
trap 'echo "Error occurred at line $LINENO"' ERR

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting Azure container initialization..."

# Azure-specific: Pre-configure XFCE to prevent power manager issues
export DISPLAY=:1
export XFCE4_POWER_MANAGER_DISABLED=1

# Run the main startup script
if [ -f /opt/.system/startup.sh ]; then
    log "Running main startup script..."
    # Run startup but don't exit if it fails
    /opt/.system/startup.sh || true
else
    log "ERROR: Main startup script not found!"
    exit 1
fi

# Azure-specific: Ensure noVNC starts WITHOUT SSL (Azure handles SSL termination)
# Kill any existing websockify processes
pkill -f websockify 2>/dev/null || true
pkill -f novnc_proxy 2>/dev/null || true
sleep 2

# Start noVNC WITHOUT SSL - Azure Container Instances handles SSL at the edge
log "Starting noVNC for Azure (HTTP only - SSL handled by Azure)..."
cd /opt/novnc && ./utils/novnc_proxy --vnc localhost:5901 --listen 6080 2>&1 | while read line; do
    echo "[noVNC] $line"
done &
sleep 3

# Azure-specific: Extra cleanup after startup
log "Azure post-startup cleanup..."
# Ensure power manager is completely disabled
pkill -f xfce4-power-manager 2>/dev/null || true
rm -f /etc/xdg/autostart/xfce4-power-manager.desktop 2>/dev/null || true
rm -f /home/desktop/.config/autostart/xfce4-power-manager.desktop 2>/dev/null || true

# Start caffeine if available
if command -v caffeine >/dev/null 2>&1; then
    su - desktop -c "DISPLAY=:1 caffeine &" 2>/dev/null || true
    log "Started caffeine daemon for Azure"
fi

# Start keep-screen-alive script if available
if [ -f /opt/keep-screen-alive.sh ]; then
    su - desktop -c "DISPLAY=:1 /opt/keep-screen-alive.sh &" 2>/dev/null || true
    log "Started keep-screen-alive service for Azure"
fi

# Azure-specific keep-alive with better error handling
log "Entering Azure keep-alive loop..."

# Signal handlers for graceful shutdown
trap 'log "Received SIGTERM, shutting down..."; exit 0' SIGTERM
trap 'log "Received SIGINT, shutting down..."; exit 0' SIGINT

# Kill any power manager processes that might have started
pkill -f xfce4-power-manager 2>/dev/null || true

# Main keep-alive loop
SCREEN_COUNTER=0
while true; do
    # Ensure screen stays awake (critical for Azure - more aggressive)
    export DISPLAY=:1
    
    # Method 1: Comprehensive xset commands
    su - desktop -c "DISPLAY=:1 xset s off" 2>/dev/null || true
    su - desktop -c "DISPLAY=:1 xset s noblank" 2>/dev/null || true
    su - desktop -c "DISPLAY=:1 xset s 0 0" 2>/dev/null || true
    su - desktop -c "DISPLAY=:1 xset -dpms" 2>/dev/null || true
    su - desktop -c "DISPLAY=:1 xset dpms 0 0 0" 2>/dev/null || true
    su - desktop -c "DISPLAY=:1 xset dpms force on" 2>/dev/null || true
    su - desktop -c "DISPLAY=:1 xset s reset" 2>/dev/null || true
    
    # Method 2: Simulate activity to keep screen active
    su - desktop -c "DISPLAY=:1 xdotool mousemove_relative 1 0" 2>/dev/null || true
    su - desktop -c "DISPLAY=:1 xdotool mousemove_relative -- -1 0" 2>/dev/null || true
    
    # Method 3: Send fake keypress every other iteration
    if [ $((SCREEN_COUNTER % 2)) -eq 0 ]; then
        su - desktop -c "DISPLAY=:1 xdotool key shift" 2>/dev/null || true
    fi
    
    # Method 4: Force display refresh via xrandr every 5 iterations
    if [ $((SCREEN_COUNTER % 5)) -eq 0 ]; then
        su - desktop -c "DISPLAY=:1 xrandr --output \$(xrandr | grep ' connected' | cut -d' ' -f1 | head -1) --brightness 1" 2>/dev/null || true
    fi
    
    # Method 5: Kill screensavers and power manager
    if [ $((SCREEN_COUNTER % 10)) -eq 0 ]; then
        pkill -f screensaver 2>/dev/null || true
        pkill -f xfce4-power-manager 2>/dev/null || true
        log "Screen keep-alive active - preventing sleep (iteration: $SCREEN_COUNTER)"
    fi
    
    SCREEN_COUNTER=$((SCREEN_COUNTER + 1))
    
    # Check system health
    HEALTHY=true
    
    # Check VNC server (both Xvnc and Xtigervnc)
    if ! pgrep -f "X.*vnc.*:1" > /dev/null 2>&1 && ! pgrep -f "Xtigervnc.*:1" > /dev/null 2>&1; then
        log "WARNING: VNC server is not running"
        HEALTHY=false
        # Try to restart VNC
        su - desktop -c "vncserver :1 -geometry 1920x1080 -depth 24 -SecurityTypes VncAuth -PasswordFile /home/desktop/.vnc/passwd" 2>&1 | while read line; do
            log "VNC: $line"
        done || true
    fi
    
    # Check noVNC proxy (websockify)
    if ! pgrep -f "websockify" > /dev/null 2>&1; then
        log "WARNING: noVNC proxy is not running"
        HEALTHY=false
        # Try to restart noVNC WITHOUT SSL (Azure handles SSL)
        cd /opt/novnc && ./utils/novnc_proxy --vnc localhost:5901 --listen 6080 2>&1 | while read line; do
            log "noVNC: $line"
        done &
    fi
    
    # Check caffeine is running
    if command -v caffeine >/dev/null 2>&1; then
        if ! pgrep -f caffeine > /dev/null 2>&1; then
            log "WARNING: Caffeine is not running, restarting..."
            su - desktop -c "DISPLAY=:1 caffeine &" 2>/dev/null || true
        fi
    fi
    
    # Check keep-screen-alive script
    if [ -f /opt/keep-screen-alive.sh ]; then
        if ! pgrep -f "keep-screen-alive" > /dev/null 2>&1; then
            log "WARNING: Keep-screen-alive service is not running, restarting..."
            su - desktop -c "DISPLAY=:1 /opt/keep-screen-alive.sh &" 2>/dev/null || true
        fi
    fi
    
    # Check AI agent (optional)
    if [ -f /opt/.ai_core/run.sh ]; then
        if ! netstat -tlnp 2>/dev/null | grep -q ":8080.*LISTEN"; then
            log "WARNING: AI agent is not running"
            # Try to restart AI agent
            export DISPLAY=:1
            export XAUTHORITY=/home/desktop/.Xauthority
            export AGENT_HOST=0.0.0.0
            export AGENT_PORT=8080
            export PYAUTOGUI_FAILSAFE=0
            /opt/.ai_core/run.sh 2>&1 | while read line; do
                log "AI-Agent: $line"
            done &
        fi
    fi
    
    # Log health status
    if [ "$HEALTHY" = true ]; then
        log "Container health check: OK"
    else
        log "Container health check: DEGRADED - attempting recovery"
    fi
    
    # Azure containers need to show activity in logs
    log "Container is running (uptime: $(uptime -p))"
    
    # Check disk space
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
        log "WARNING: Disk usage is high: ${DISK_USAGE}%"
        # Clean up some temporary files
        rm -rf /tmp/* 2>/dev/null || true
        find /var/log -type f -name "*.log" -size +100M -delete 2>/dev/null || true
    fi
    
    # Sleep for 60 seconds (longer interval for Azure)
    sleep 60
done