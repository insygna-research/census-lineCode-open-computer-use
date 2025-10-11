#!/bin/bash
# Comprehensive screen keep-alive script for Azure and local environments
# This script uses multiple methods to ensure the screen never sleeps

export DISPLAY=:1

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [KeepAlive] $1"
}

log "Starting comprehensive screen keep-alive service..."

# Method 1: Disable DPMS (Display Power Management Signaling)
disable_dpms() {
    xset -dpms 2>/dev/null || true
    xset s off 2>/dev/null || true
    xset s noblank 2>/dev/null || true
    xset s 0 0 2>/dev/null || true
}

# Method 2: Prevent screensaver
disable_screensaver() {
    # Disable XFCE screensaver
    xfconf-query -c xfce4-screensaver -p /saver/enabled -s false 2>/dev/null || true
    xfconf-query -c xfce4-screensaver -p /saver/mode -s 0 2>/dev/null || true
    xfconf-query -c xfce4-screensaver -p /lock/enabled -s false 2>/dev/null || true
    
    # Kill any screensaver processes
    pkill -f screensaver 2>/dev/null || true
    pkill -f xscreensaver 2>/dev/null || true
    pkill -f gnome-screensaver 2>/dev/null || true
    pkill -f mate-screensaver 2>/dev/null || true
}

# Method 3: Disable power management
disable_power_management() {
    # XFCE power manager settings
    xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/dpms-enabled -s false 2>/dev/null || true
    xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/blank-on-ac -s 0 2>/dev/null || true
    xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/dpms-on-ac-sleep -s 0 2>/dev/null || true
    xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/dpms-on-ac-off -s 0 2>/dev/null || true
    xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/inactivity-on-ac -s 0 2>/dev/null || true
}

# Method 4: Simulate activity using xdotool (mouse movement)
simulate_activity() {
    if command -v xdotool >/dev/null 2>&1; then
        # Get current mouse position
        eval $(xdotool getmouselocation --shell 2>/dev/null || echo "X=100 Y=100")
        # Move mouse slightly and move it back
        xdotool mousemove $((X+1)) $((Y+1)) 2>/dev/null || true
        sleep 0.1
        xdotool mousemove $X $Y 2>/dev/null || true
    fi
}

# Method 5: Use caffeine if available
start_caffeine() {
    if command -v caffeine >/dev/null 2>&1; then
        pkill -f caffeine 2>/dev/null || true
        caffeine &
        log "Started caffeine daemon"
    fi
}

# Method 6: Send fake keypress events
send_fake_key() {
    if command -v xdotool >/dev/null 2>&1; then
        # Send a harmless key (Shift key press and release)
        xdotool key shift 2>/dev/null || true
    fi
}

# Method 7: Reset idle timer using xset
reset_idle_timer() {
    xset s reset 2>/dev/null || true
}

# Method 8: Keep X11 active by querying it
keep_x11_active() {
    xset q >/dev/null 2>&1 || true
    xwininfo -root >/dev/null 2>&1 || true
    xprop -root >/dev/null 2>&1 || true
}

# Initial setup - run all disable methods
log "Running initial screen sleep prevention setup..."
disable_dpms
disable_screensaver
disable_power_management
start_caffeine

# Main loop - continuously prevent screen sleep
log "Entering main keep-alive loop..."
COUNTER=0

while true; do
    # Run different methods at different intervals for redundancy
    
    # Every iteration (30 seconds)
    disable_dpms
    reset_idle_timer
    keep_x11_active
    
    # Every 2 iterations (1 minute)
    if [ $((COUNTER % 2)) -eq 0 ]; then
        simulate_activity
        disable_screensaver
    fi
    
    # Every 4 iterations (2 minutes)
    if [ $((COUNTER % 4)) -eq 0 ]; then
        send_fake_key
        disable_power_management
    fi
    
    # Every 10 iterations (5 minutes)
    if [ $((COUNTER % 10)) -eq 0 ]; then
        log "Screen keep-alive is active (running for $((COUNTER * 30)) seconds)"
        
        # Verify DPMS is still disabled
        if xset q 2>/dev/null | grep -q "DPMS is Enabled"; then
            log "WARNING: DPMS was re-enabled, disabling again..."
            disable_dpms
        fi
        
        # Check if caffeine is still running
        if command -v caffeine >/dev/null 2>&1; then
            if ! pgrep -f caffeine >/dev/null 2>&1; then
                log "Restarting caffeine daemon..."
                start_caffeine
            fi
        fi
    fi
    
    COUNTER=$((COUNTER + 1))
    sleep 30
done