#!/bin/bash

# Run security hardening first
if [ -f /opt/.system/security-hardening.sh ]; then
    echo "Applying security hardening..."
    chmod 700 /opt/.system/security-hardening.sh
    /opt/.system/security-hardening.sh
fi

# Copy display recovery script to system directory
if [ -f /opt/.system/display_recovery.sh ]; then
    echo "Setting up display recovery script..."
    chmod 755 /opt/.system/display_recovery.sh
else
    echo "Warning: Display recovery script not found"
fi

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
# Kill any lingering Chrome processes from previous runs
pkill -f chrome || true
pkill -f chromium || true

# Clean up Chrome profile directories
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

# Create Chrome directories with proper permissions
mkdir -p /home/desktop/.config/google-chrome-docker
mkdir -p /home/desktop/.config/google-chrome-docker/Default
chown -R desktop:desktop /home/desktop/.config

# Create Chrome preferences to disable all popups and What's New
cat > /home/desktop/.config/google-chrome-docker/Default/Preferences << 'PREFS_EOF'
{
  "browser": {
    "show_home_button": false,
    "check_default_browser": false,
    "has_seen_welcome_page": true,
    "should_reset_check_default_browser": false,
    "custom_chrome_frame": false
  },
  "distribution": {
    "suppress_first_run_bubble": true,
    "suppress_first_run_default_browser_prompt": true,
    "make_chrome_default": false,
    "make_chrome_default_for_user": false,
    "verbose_logging": false,
    "suppress_bug_report_prompt": true,
    "skip_first_run_ui": true,
    "import_bookmarks": false,
    "import_history": false,
    "import_home_page": false,
    "import_search_engine": false,
    "show_welcome_page": false,
    "do_not_create_desktop_shortcut": true,
    "do_not_create_quick_launch_shortcut": true,
    "do_not_launch_chrome": false,
    "do_not_register_for_update_launch": true
  },
  "first_run_tabs": [],
  "homepage": "about:blank",
  "homepage_is_newtabpage": false,
  "profile": {
    "default_content_setting_values": {
      "notifications": 2,
      "geolocation": 2,
      "media_stream": 2
    },
    "password_manager_enabled": false,
    "exit_type": "Normal",
    "exited_cleanly": true
  },
  "signin": {
    "allowed": true
  },
  "ntp": {
    "num_personal_suggestions": 0
  },
  "search": {
    "suggest_enabled": false
  },
  "safebrowsing": {
    "enabled": false
  },
  "privacy_sandbox": {
    "privacy_sandbox_enabled": false,
    "topics_consent_given": false,
    "fledge_consent_given": false,
    "ad_measurement_consent_given": false
  },
  "chrome_labs": {
    "enabled": false
  },
  "whats_new": {
    "show_on_startup": false,
    "used_first_run_flow": true,
    "has_seen_whats_new": true
  },
  "user_experience_metrics": {
    "reporting_enabled": false
  },
  "default_apps_install_state": 3
}
PREFS_EOF

# Create Local State file
cat > /home/desktop/.config/google-chrome-docker/"Local State" << 'LOCAL_EOF'
{
  "background_mode": {
    "enabled": false
  },
  "hardware_acceleration_mode": {
    "enabled": false
  },
  "browser": {
    "enabled_labs_experiments": [],
    "suppress_default_browser_prompt_for_version": "999"
  },
  "privacy_sandbox": {
    "privacy_sandbox_enabled": false
  },
  "first_run_finished": true,
  "profile": {
    "info_cache": {
      "Default": {
        "is_using_default_avatar": true,
        "is_using_default_name": true
      }
    }
  },
  "was_reset": false,
  "browser_version": "999.0.0.0"
}
LOCAL_EOF

# Create First Run file to prevent first run experience
touch "/home/desktop/.config/google-chrome-docker/First Run"

# Set proper ownership
chown -R desktop:desktop /home/desktop/.config/google-chrome-docker

echo "Chrome cleanup and preferences setup completed"

# ========================================
# VNC Server Setup
# ========================================
# Clean up any existing VNC locks/processes first
echo "Cleaning up existing VNC processes..."
# Kill both Xvnc and Xtigervnc
pkill -f "X.*vnc.*:1" 2>/dev/null || true
pkill -f "Xtigervnc.*:1" 2>/dev/null || true
pkill -f "Xvnc :1" 2>/dev/null || true
pkill -f "vncserver" 2>/dev/null || true
sleep 2
rm -f /tmp/.X1-lock 2>/dev/null || true
rm -f /tmp/.X11-unix/X1 2>/dev/null || true
rm -f /home/desktop/.vnc/*.pid 2>/dev/null || true
rm -f /home/desktop/.vnc/*.log 2>/dev/null || true

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

# Start VNC server with retry logic
echo "Starting VNC server..."
VNC_START_ATTEMPTS=0
VNC_MAX_ATTEMPTS=3
while [ $VNC_START_ATTEMPTS -lt $VNC_MAX_ATTEMPTS ]; do
    if su - desktop -c "vncserver :1 -geometry ${VNC_RESOLUTION:-1920x1080} -depth ${VNC_COL_DEPTH:-24} -SecurityTypes VncAuth -PasswordFile /home/desktop/.vnc/passwd" 2>&1; then
        echo "VNC server started successfully"
        break
    fi
    VNC_START_ATTEMPTS=$((VNC_START_ATTEMPTS + 1))
    echo "VNC server start attempt $VNC_START_ATTEMPTS failed, retrying..."
    sleep 2
done

if [ $VNC_START_ATTEMPTS -eq $VNC_MAX_ATTEMPTS ]; then
    echo "ERROR: Failed to start VNC server after $VNC_MAX_ATTEMPTS attempts"
fi

# Wait for X11 display to be ready
echo "Waiting for X11 display to be ready..."
DISPLAY=:1
export DISPLAY
MAX_ATTEMPTS=30
ATTEMPT=0

# First ensure VNC process is actually running (check both Xvnc and Xtigervnc)
if ! pgrep -f "X.*vnc.*:1" >/dev/null && ! pgrep -f "Xtigervnc.*:1" >/dev/null; then
    echo "ERROR: VNC server process not found after startup"
    # Try one more time to start it
    echo "Attempting to start VNC server again..."
    su - desktop -c "vncserver :1 -geometry ${VNC_RESOLUTION:-1920x1080} -depth ${VNC_COL_DEPTH:-24} -SecurityTypes VncAuth -PasswordFile /home/desktop/.vnc/passwd"
    sleep 3
fi

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
    # If display is not ready, try to recover it
    if [ -f /opt/.system/display_recovery.sh ]; then
        echo "Attempting display recovery..."
        /opt/.system/display_recovery.sh recover
    fi
else
    # Give the desktop environment a bit more time to fully initialize
    echo "Giving desktop environment time to fully initialize..."
    sleep 3
fi

# Copy .Xauthority for AI agent
if [ -f /home/desktop/.Xauthority ]; then
    cp /home/desktop/.Xauthority /root/.Xauthority 2>/dev/null || true
    echo ".Xauthority copied to root"
else
    echo "Warning: .Xauthority not found"
fi

# Aggressive screen blanking and power management prevention for Azure
echo "Applying aggressive screen sleep prevention..."

# Method 1: Comprehensive xset commands
su - desktop -c "DISPLAY=:1 xset s off" 2>/dev/null || true
su - desktop -c "DISPLAY=:1 xset s noblank" 2>/dev/null || true
su - desktop -c "DISPLAY=:1 xset s 0 0" 2>/dev/null || true
su - desktop -c "DISPLAY=:1 xset -dpms" 2>/dev/null || true
su - desktop -c "DISPLAY=:1 xset dpms 0 0 0" 2>/dev/null || true
su - desktop -c "DISPLAY=:1 xset dpms force on" 2>/dev/null || true

# Method 2: Kill any screensaver and power manager processes to prevent issues
pkill -f screensaver 2>/dev/null || true
pkill -f xscreensaver 2>/dev/null || true
pkill -f xfce4-power-manager 2>/dev/null || true

# Method 3: Start caffeine in the background
if command -v caffeine >/dev/null 2>&1; then
    su - desktop -c "DISPLAY=:1 caffeine &" 2>/dev/null || true
    echo "Started caffeine for screen keep-alive"
fi

# Method 4: Disable via xscreensaver-command
if command -v xscreensaver-command >/dev/null 2>&1; then
    su - desktop -c "DISPLAY=:1 xscreensaver-command -exit" 2>/dev/null || true
fi

# ========================================
# XFCE Desktop Configuration
# ========================================
echo "Configuring XFCE desktop..."

# Create XFCE config directory
mkdir -p /home/desktop/.config/xfce4/xfconf/xfce-perchannel-xml

# Configure Thunar to allow executable files
cat > /home/desktop/.config/xfce4/xfconf/xfce-perchannel-xml/thunar.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="thunar" version="1.0">
  <property name="misc-exec-shell-scripts-by-default" type="bool" value="true"/>
  <property name="misc-folders-first" type="bool" value="true"/>
</channel>
EOF

# Configure XFCE Power Manager to prevent sleep and panel issues
cat > /home/desktop/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-power-manager.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-power-manager" version="1.0">
  <property name="xfce4-power-manager" type="empty">
    <property name="power-button-action" type="uint" value="0"/>
    <property name="sleep-button-action" type="uint" value="0"/>
    <property name="hibernate-button-action" type="uint" value="0"/>
    <property name="show-tray-icon" type="bool" value="false"/>
    <property name="show-panel-label" type="bool" value="false"/>
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
    <property name="handle-brightness-keys" type="bool" value="false"/>
    <property name="critical-power-level" type="uint" value="5"/>
    <property name="critical-power-action" type="uint" value="0"/>
    <property name="lock-screen-suspend-hibernate" type="bool" value="false"/>
    <property name="logind-handle-lid-switch" type="bool" value="false"/>
    <property name="presentation-mode" type="bool" value="true"/>
  </property>
</channel>
EOF

# Configure XFCE screensaver to be disabled
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

# Configure XFCE Panel to prevent plugin errors
cat > /home/desktop/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-panel.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-panel" version="1.0">
  <property name="configver" type="int" value="2"/>
  <property name="panels" type="array">
    <value type="int" value="1"/>
    <property name="panel-1" type="empty">
      <property name="position" type="string" value="p=8;x=640;y=877"/>
      <property name="length" type="uint" value="100"/>
      <property name="position-locked" type="bool" value="true"/>
      <property name="size" type="uint" value="30"/>
      <property name="plugin-ids" type="array">
        <value type="int" value="1"/>
        <value type="int" value="2"/>
        <value type="int" value="3"/>
        <value type="int" value="4"/>
        <value type="int" value="5"/>
      </property>
    </property>
  </property>
  <property name="plugins" type="empty">
    <property name="plugin-1" type="string" value="applicationsmenu"/>
    <property name="plugin-2" type="string" value="tasklist"/>
    <property name="plugin-3" type="string" value="separator"/>
    <property name="plugin-4" type="string" value="clock"/>
    <property name="plugin-5" type="string" value="systray"/>
    <!-- Explicitly exclude power-manager-plugin to prevent crashes -->
  </property>
</channel>
EOF

# Disable XFCE panel plugin crash notifications and power manager autostart
mkdir -p /home/desktop/.config/xfce4
cat > /home/desktop/.config/xfce4/helpers.rc << 'EOF'
# Disable plugin crash notifications
TerminalEmulator=xfce4-terminal
EOF

# Configure XFCE Session to not start power manager
cat > /home/desktop/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-session.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-session" version="1.0">
  <property name="general" type="empty">
    <property name="FailsafeSessionName" type="string" value="Failsafe"/>
    <property name="SaveOnExit" type="bool" value="false"/>
    <property name="SessionName" type="string" value="Default"/>
  </property>
  <property name="sessions" type="empty">
    <property name="Failsafe" type="empty">
      <property name="IsFailsafe" type="bool" value="true"/>
      <property name="Count" type="int" value="5"/>
      <property name="Client0_Command" type="array">
        <value type="string" value="xfwm4"/>
      </property>
      <property name="Client1_Command" type="array">
        <value type="string" value="xfce4-panel"/>
      </property>
      <property name="Client2_Command" type="array">
        <value type="string" value="xfdesktop"/>
      </property>
      <property name="Client3_Command" type="array">
        <value type="string" value="thunar"/>
        <value type="string" value="--daemon"/>
      </property>
      <property name="Client4_Command" type="array">
        <value type="string" value="xfce4-settings-helper"/>
      </property>
      <!-- Explicitly exclude xfce4-power-manager -->
    </property>
  </property>
</channel>
EOF

# Prevent power manager from autostarting
rm -f /etc/xdg/autostart/xfce4-power-manager.desktop 2>/dev/null || true
rm -f /home/desktop/.config/autostart/xfce4-power-manager.desktop 2>/dev/null || true

# Set proper ownership
chown -R desktop:desktop /home/desktop/.config

# Create autostart entry to trust desktop files on login
mkdir -p /home/desktop/.config/autostart
cat > /home/desktop/.config/autostart/trust-desktop-files.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=Trust Desktop Files
Comment=Mark desktop files as trusted
Exec=sh -c "cd /home/desktop/Desktop && chmod 755 *.desktop && gio set chrome.desktop metadata::trusted true && gio set terminal.desktop metadata::trusted true"
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF
chmod 755 /home/desktop/.config/autostart/trust-desktop-files.desktop
chown desktop:desktop /home/desktop/.config/autostart/trust-desktop-files.desktop

# Create autostart entry to keep screen awake with comprehensive methods
cat > /home/desktop/.config/autostart/keep-awake.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=Keep Screen Awake
Comment=Prevent screen from sleeping with multiple methods
Exec=sh -c "while true; do xset s off s noblank s 0 0; xset -dpms; xset dpms 0 0 0; xset dpms force on; xdotool mousemove_relative 1 0 2>/dev/null; xdotool mousemove_relative -- -1 0 2>/dev/null; xset s reset; sleep 30; done"
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
StartupNotify=false
Terminal=false
EOF
chmod 755 /home/desktop/.config/autostart/keep-awake.desktop
chown desktop:desktop /home/desktop/.config/autostart/keep-awake.desktop

# Create a second autostart entry for caffeine
cat > /home/desktop/.config/autostart/caffeine.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=Caffeine
Comment=Keep display awake
Exec=caffeine
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
StartupNotify=false
Terminal=false
Icon=caffeine
EOF
chmod 755 /home/desktop/.config/autostart/caffeine.desktop
chown desktop:desktop /home/desktop/.config/autostart/caffeine.desktop

# ========================================
# Desktop Shortcuts Setup
# ========================================
echo "Setting up desktop shortcuts..."

# Create desktop directory
mkdir -p /home/desktop/Desktop

# Create Chrome desktop shortcut with debugging enabled
cat > /home/desktop/Desktop/chrome.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Google Chrome
Comment=Access the Internet
Exec=/usr/bin/google-chrome-stable --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --user-data-dir=/home/desktop/.config/google-chrome-docker --test-type --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --enable-automation --no-first-run --no-default-browser-check --disable-features=ChromeWhatsNewUI,PrivacySandboxSettings4 --disable-infobars --disable-session-crashed-bubble --disable-translate --start-maximized
Icon=google-chrome
Path=/home/desktop
Terminal=false
Categories=Network;WebBrowser;
StartupNotify=true
EOF

# Also create a launcher in the applications menu with the same configuration
mkdir -p /home/desktop/.local/share/applications
cp /home/desktop/Desktop/chrome.desktop /home/desktop/.local/share/applications/
chmod 755 /home/desktop/.local/share/applications/chrome.desktop

# Update the system-wide Chrome desktop file to include debugging
if [ -f /usr/share/applications/google-chrome.desktop ]; then
    cp /usr/share/applications/google-chrome.desktop /home/desktop/.local/share/applications/google-chrome.desktop
    sed -i 's|Exec=/usr/bin/google-chrome-stable|Exec=/usr/bin/google-chrome-stable --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --user-data-dir=/home/desktop/.config/google-chrome-docker --test-type --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --enable-automation --no-first-run --no-default-browser-check --disable-features=ChromeWhatsNewUI,PrivacySandboxSettings4 --disable-infobars --disable-session-crashed-bubble --disable-translate --start-maximized|g' /home/desktop/.local/share/applications/google-chrome.desktop
fi

chown -R desktop:desktop /home/desktop/.local

# Create Terminal desktop shortcut
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

# Make desktop files executable and trusted
chmod 755 /home/desktop/Desktop/*.desktop
chown -R desktop:desktop /home/desktop/Desktop

# Mark desktop files as trusted (XFCE requirement)
# Method 1: Using gio
su - desktop -c "cd /home/desktop/Desktop && for f in *.desktop; do gio set \"\$f\" metadata::trusted true 2>/dev/null || true; done"

# Method 2: Using xfce4 settings to trust all desktop files
su - desktop -c "DISPLAY=:1 xfconf-query -c thunar -p /misc-exec-shell-scripts-by-default -n -t bool -s true 2>/dev/null || true"

# Method 3: Mark as executable with specific permissions
chmod 755 /home/desktop/Desktop/chrome.desktop
chmod 755 /home/desktop/Desktop/terminal.desktop

# Method 4: Add trust attribute directly
if command -v setfattr >/dev/null 2>&1; then
    setfattr -n user.trusted -v yes /home/desktop/Desktop/*.desktop 2>/dev/null || true
fi

# ========================================
# noVNC WebSocket Proxy
# ========================================
# Configure noVNC
if [ -f /novnc-config.sh ]; then
    chmod +x /novnc-config.sh
    /novnc-config.sh
fi

# Start noVNC WebSocket proxy
cd /opt/novnc && ./utils/novnc_proxy --vnc localhost:${VNC_PORT:-5901} --listen ${WEBSOCKET_PORT:-6080} &

# ========================================
# AI Agent Setup
# ========================================
# Ensure AI agent script has correct permissions and line endings
dos2unix /opt/.ai_core/start_agent.sh 2>/dev/null || true
chmod +x /opt/.ai_core/start_agent.sh
chmod +x /opt/.ai_core/*.pyc 2>/dev/null || true

# Create log file with proper permissions before starting agent
touch /var/log/ai_agent.log
chmod 666 /var/log/ai_agent.log
chown desktop:desktop /var/log/ai_agent.log

# Start AI agent with proper display and X11 auth
echo "Starting AI agent..."
export DISPLAY=:1
export XAUTHORITY=/home/desktop/.Xauthority
export AGENT_HOST=0.0.0.0
export AGENT_PORT=8080
export PYAUTOGUI_FAILSAFE=0

# Test Python environment first (only after X11 is ready)
echo "Testing Python environment..."
# Only run the test if X11 is available
if su - desktop -c "DISPLAY=:1 xset q" >/dev/null 2>&1; then
    if [ -f /opt/.ai_core/test_imports.cpython-310.opt-1.pyc ]; then
        cd /opt/.ai_core
        python3 test_imports.cpython-310.opt-1.pyc
        if [ $? -ne 0 ]; then
            echo "⚠️ Python environment test failed - AI agent may not work properly"
        else
            echo "✅ Python environment test passed"
        fi
    else
        echo "⚠️ Test file not found - skipping environment test"
    fi
else
    echo "⚠️ Skipping Python environment test - X11 not available"
fi

# Start the AI agent securely
echo "Starting AI agent server..."

# Run the secure AI agent wrapper
if [ -f /opt/.ai_core/run.sh ]; then
    /opt/.ai_core/run.sh 2>&1 | while IFS= read -r line; do
        echo "[AI-Agent] $line"
    done &
else
    echo "❌ AI agent not found - service unavailable"
fi

AI_AGENT_PID=$!
echo "AI agent process started with PID: $AI_AGENT_PID"

# Give it time to start and show initial output
sleep 3

# Check if the process is still running
if ps -p $AI_AGENT_PID > /dev/null 2>&1; then
    echo "✅ AI agent process is running"
    
    # Check if port 8080 is listening
    if netstat -tln | grep -q :8080; then
        echo "✅ AI agent is listening on port 8080"
    else
        echo "⚠️ AI agent process is running but port 8080 is not open yet"
        echo "   It may still be starting up..."
    fi
else
    echo "❌ AI agent process died - check logs above for errors"
fi

# ========================================
# Final Status
# ========================================
echo "VNC server started on port ${VNC_PORT:-5901}"
echo "noVNC web interface available on port ${WEBSOCKET_PORT:-6080}"
echo ""
echo "Chrome wrappers available:"
echo "- Standard automation: chrome-wrapper (or 'chrome' alias)"
echo "- Authentication-friendly: chrome-auth-wrapper (or 'chrome-auth' alias)"

# ========================================
# Keep Container Running
# ========================================
# More robust way to keep container running that works in Azure
echo "Container is ready and running..."

# Create a keep-alive loop that monitors services
LAST_RECOVERY=0
RECOVERY_COOLDOWN=300  # 5 minutes between recovery attempts
while true; do
    # Check display health and recover if needed
    CURRENT_TIME=$(date +%s)
    TIME_SINCE_RECOVERY=$((CURRENT_TIME - LAST_RECOVERY))
    
    if [ -f /opt/.system/display_recovery.sh ]; then
        # Only check health if enough time has passed since last recovery
        if [ $TIME_SINCE_RECOVERY -gt $RECOVERY_COOLDOWN ]; then
            if ! /opt/.system/display_recovery.sh check >/dev/null 2>&1; then
                echo "Display health check failed, attempting recovery..."
                /opt/.system/display_recovery.sh recover
                LAST_RECOVERY=$(date +%s)
                # Give services time to restart
                sleep 10
            fi
        fi
    else
        # Fallback to basic checks if recovery script not available
        # Check if VNC server is still running (both Xvnc and Xtigervnc)
        if ! pgrep -f "X.*vnc.*:1" > /dev/null && ! pgrep -f "Xtigervnc.*:1" > /dev/null; then
            if [ $TIME_SINCE_RECOVERY -gt $RECOVERY_COOLDOWN ]; then
                echo "VNC server died, restarting..."
                # Clean up stale locks first
                rm -f /tmp/.X1-lock 2>/dev/null || true
                rm -f /tmp/.X11-unix/X1 2>/dev/null || true
                su - desktop -c "vncserver :1 -geometry ${VNC_RESOLUTION:-1920x1080} -depth ${VNC_COL_DEPTH:-24} -SecurityTypes VncAuth -PasswordFile /home/desktop/.vnc/passwd"
                # Regenerate X authority
                cp /home/desktop/.Xauthority /root/.Xauthority 2>/dev/null || true
                LAST_RECOVERY=$(date +%s)
            fi
        fi
    fi
    
    # Check if noVNC is still running
    if ! pgrep -f "novnc_proxy" > /dev/null; then
        echo "noVNC died, restarting..."
        cd /opt/novnc && ./utils/novnc_proxy --vnc localhost:${VNC_PORT:-5901} --listen ${WEBSOCKET_PORT:-6080} &
    fi
    
    # Check if AI agent is still running (if it was started)
    if [ -f /opt/.ai_core/run.sh ]; then
        # Check both process and port to be sure
        AI_RUNNING=false
        
        # Check if port 8080 is listening (most reliable)
        if netstat -tlnp 2>/dev/null | grep -q ":8080.*LISTEN"; then
            AI_RUNNING=true
        fi
        
        # Also check for python process running from .ai_core directory
        if pgrep -f "python3.*\.ai_core" > /dev/null; then
            AI_RUNNING=true
        fi
        
        if [ "$AI_RUNNING" = "false" ]; then
            echo "AI agent died, restarting..."
            export DISPLAY=:1
            export XAUTHORITY=/home/desktop/.Xauthority
            export AGENT_HOST=0.0.0.0
            export AGENT_PORT=8080
            export PYAUTOGUI_FAILSAFE=0
            /opt/.ai_core/run.sh 2>&1 | while IFS= read -r line; do
                echo "[AI-Agent] $line"
            done &
            sleep 5  # Give it time to start
        fi
    fi
    
    # Sleep for 30 seconds before next check
    sleep 30
done