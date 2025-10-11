#!/bin/bash

# Secure startup script - runs as root with protected components

# Security: Clear command history on startup
history -c
> ~/.bash_history

# Ensure VNC directory exists with correct permissions
mkdir -p /home/desktop/.vnc
chown -R desktop:desktop /home/desktop

# Set proper locale to avoid UTF-8 issues
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Ensure desktop user has a proper home directory
usermod -d /home/desktop desktop 2>/dev/null || true

# ========================================
# Chrome Profile Cleanup
# ========================================
echo "Cleaning up Chrome profile locks..."
pkill -f chrome || true
pkill -f chromium || true

CHROME_DIRS="/home/desktop/.config/google-chrome /home/desktop/.config/google-chrome-docker /home/desktop/.config/chromium"
for dir in $CHROME_DIRS; do
    if [ -d "$dir" ]; then
        echo "Cleaning $dir..."
        rm -f "$dir/SingletonLock" 2>/dev/null || true
        rm -f "$dir/SingletonCookie" 2>/dev/null || true  
        rm -f "$dir/SingletonSocket" 2>/dev/null || true
        rm -rf "$dir/Singleton"* 2>/dev/null || true
        find "$dir" -name "lockfile" -type f -delete 2>/dev/null || true
        find "$dir" -name ".lock" -type f -delete 2>/dev/null || true
        find "$dir" -name "lock" -type f -delete 2>/dev/null || true
    fi
done

mkdir -p /home/desktop/.config/google-chrome-docker
chown -R desktop:desktop /home/desktop/.config

echo "Chrome cleanup completed"

# ========================================
# VNC Server Setup
# ========================================
# Copy xstartup file to user's .vnc directory
cp /opt/xstartup /home/desktop/.vnc/xstartup
chmod 755 /home/desktop/.vnc/xstartup
chown desktop:desktop /home/desktop/.vnc/xstartup

# Set VNC password from environment variable
if [ -n "$VNC_PASSWORD" ]; then
    echo "$VNC_PASSWORD" | su - desktop -c "vncpasswd -f > /home/desktop/.vnc/passwd"
    chmod 600 /home/desktop/.vnc/passwd
    chown desktop:desktop /home/desktop/.vnc/passwd
else
    # Generate a random password if not provided
    RANDOM_PASS=$(openssl rand -base64 12)
    echo "$RANDOM_PASS" | su - desktop -c "vncpasswd -f > /home/desktop/.vnc/passwd"
    chmod 600 /home/desktop/.vnc/passwd
    chown desktop:desktop /home/desktop/.vnc/passwd
    echo "Generated VNC password: $RANDOM_PASS"
fi

# Start VNC server as desktop user
echo "Starting VNC server..."
su - desktop -c "vncserver :1 -geometry ${VNC_RESOLUTION:-1920x1080} -depth ${VNC_COL_DEPTH:-24} -SecurityTypes VncAuth -PasswordFile /home/desktop/.vnc/passwd"

# Wait for X11 display to be ready
echo "Waiting for X11 display to be ready..."
DISPLAY=:1
export DISPLAY
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if su - desktop -c "DISPLAY=:1 xset q" >/dev/null 2>&1; then
        echo "X11 display is ready!"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo "Waiting for X11 display... attempt $ATTEMPT/$MAX_ATTEMPTS"
    sleep 1
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "Warning: X11 display may not be fully ready after $MAX_ATTEMPTS attempts"
else
    echo "Giving desktop environment time to fully initialize..."
    sleep 3
fi

# Copy .Xauthority for AI agent (running as root)
cp /home/desktop/.Xauthority /root/.Xauthority 2>/dev/null || true

# Disable screen blanking and power management
su - desktop -c "DISPLAY=:1 xset s off" 2>/dev/null || true
su - desktop -c "DISPLAY=:1 xset q | grep -q DPMS && xset -dpms" 2>/dev/null || true
su - desktop -c "DISPLAY=:1 xset s noblank" 2>/dev/null || true

# ========================================
# Desktop Configuration (same as before)
# ========================================
echo "Configuring XFCE desktop..."

mkdir -p /home/desktop/.config/xfce4/xfconf/xfce-perchannel-xml

cat > /home/desktop/.config/xfce4/xfconf/xfce-perchannel-xml/thunar.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="thunar" version="1.0">
  <property name="misc-exec-shell-scripts-by-default" type="bool" value="true"/>
  <property name="misc-folders-first" type="bool" value="true"/>
</channel>
EOF

cat > /home/desktop/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-power-manager.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-power-manager" version="1.0">
  <property name="xfce4-power-manager" type="empty">
    <property name="power-button-action" type="uint" value="0"/>
    <property name="sleep-button-action" type="uint" value="0"/>
    <property name="hibernate-button-action" type="uint" value="0"/>
    <property name="show-tray-icon" type="bool" value="false"/>
    <property name="general-notification" type="bool" value="false"/>
    <property name="inactivity-on-ac" type="uint" value="0"/>
    <property name="inactivity-on-battery" type="uint" value="0"/>
    <property name="inactivity-sleep-mode-on-ac" type="uint" value="0"/>
    <property name="inactivity-sleep-mode-on-battery" type="uint" value="0"/>
    <property name="dpms-enabled" type="bool" value="false"/>
    <property name="dpms-on-ac-sleep" type="uint" value="0"/>
    <property name="dpms-on-ac-off" type="uint" value="0"/>
    <property name="dpms-on-battery-sleep" type="uint" value="0"/>
    <property name="dpms-on-battery-off" type="uint" value="0"/>
    <property name="blank-on-ac" type="int" value="0"/>
    <property name="blank-on-battery" type="int" value="0"/>
    <property name="brightness-switch-restore-on-exit" type="int" value="0"/>
    <property name="brightness-switch" type="int" value="0"/>
  </property>
</channel>
EOF

cat > /home/desktop/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-screensaver.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-screensaver" version="1.0">
  <property name="saver" type="empty">
    <property name="mode" type="int" value="0"/>
    <property name="enabled" type="bool" value="false"/>
  </property>
  <property name="lock" type="empty">
    <property name="enabled" type="bool" value="false"/>
  </property>
</channel>
EOF

chown -R desktop:desktop /home/desktop/.config

# Create desktop shortcuts
mkdir -p /home/desktop/Desktop

cat > /home/desktop/Desktop/chrome.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Google Chrome
Comment=Access the Internet
Exec=/usr/bin/google-chrome-stable --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --user-data-dir=/home/desktop/.config/google-chrome-docker --test-type --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --enable-automation
Icon=google-chrome
Path=/home/desktop
Terminal=false
Categories=Network;WebBrowser;
StartupNotify=true
EOF

cat > /home/desktop/Desktop/terminal.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Terminal
Comment=Terminal Emulator
Exec=xfce4-terminal
Icon=utilities-terminal
Path=/home/desktop
Terminal=false
Categories=System;TerminalEmulator;
StartupNotify=true
EOF

chmod 755 /home/desktop/Desktop/*.desktop
chown -R desktop:desktop /home/desktop/Desktop

# ========================================
# noVNC WebSocket Proxy
# ========================================
if [ -f /novnc-config.sh ]; then
    chmod +x /novnc-config.sh
    /novnc-config.sh
fi

cd /opt/novnc && ./utils/novnc_proxy --vnc localhost:${VNC_PORT:-5901} --listen ${WEBSOCKET_PORT:-6080} &

# ========================================
# SECURE AI Agent Setup (Running as ROOT)
# ========================================
echo "Starting AI agent service..."

# Create secure log file
touch /var/log/ai_agent.log
chmod 600 /var/log/ai_agent.log
chown root:root /var/log/ai_agent.log

# Set environment for AI agent
export DISPLAY=:1
export XAUTHORITY=/root/.Xauthority
export AGENT_HOST=0.0.0.0
export AGENT_PORT=8080
export PYAUTOGUI_FAILSAFE=0

# Wait for X11 to be fully ready
sleep 2

# Start the protected AI agent as root (users cannot access this)
if [ -f /opt/.ai_core/run.sh ]; then
    echo "Starting protected AI agent..."
    /opt/.ai_core/run.sh 2>&1 | while IFS= read -r line; do
        echo "[AI-Agent] $line"
    done &
    
    AI_AGENT_PID=$!
    echo "AI agent process started with PID: $AI_AGENT_PID"
    
    sleep 3
    
    if ps -p $AI_AGENT_PID > /dev/null 2>&1; then
        echo "✅ AI agent process is running"
        if netstat -tln | grep -q :8080; then
            echo "✅ AI agent is listening on port 8080"
        else
            echo "⚠️ AI agent process is running but port 8080 is not open yet"
        fi
    else
        echo "❌ AI agent process died - check logs"
    fi
else
    echo "⚠️ Protected AI agent not found - using fallback"
fi

# ========================================
# Security Hardening
# ========================================
# Remove shell history for desktop user
rm -f /home/desktop/.bash_history
rm -f /home/desktop/.python_history

# Disable shell history for desktop user
echo "unset HISTFILE" >> /home/desktop/.bashrc
echo "HISTSIZE=0" >> /home/desktop/.bashrc

# Protect sensitive directories
chmod 700 /opt/.ai_core 2>/dev/null || true
chmod 700 /opt/.system 2>/dev/null || true

# Clear root command history
history -c
> ~/.bash_history

# ========================================
# Final Status
# ========================================
echo "VNC server started on port ${VNC_PORT:-5901}"
echo "noVNC web interface available on port ${WEBSOCKET_PORT:-6080}"
echo "AI Agent WebSocket available on port 8080"
echo "System is ready and secured."

# Keep container running
tail -f /home/desktop/.vnc/*.log 2>/dev/null || tail -f /dev/null