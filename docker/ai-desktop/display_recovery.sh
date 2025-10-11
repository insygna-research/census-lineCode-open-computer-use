#!/bin/bash

# =====================================================
# Display Recovery Script - Fix X server and VNC issues
# =====================================================

set -e

# Configuration
VNC_DISPLAY=":1"
VNC_PORT="${VNC_PORT:-5901}"
VNC_RESOLUTION="${VNC_RESOLUTION:-1920x1080}"
VNC_DEPTH="${VNC_COL_DEPTH:-24}"
LOG_FILE="/var/log/display_recovery.log"
MAX_RETRIES=3
RETRY_DELAY=2

# Logging function
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check if X server is responding
check_x_server() {
    local display=$1
    if su - desktop -c "DISPLAY=$display xset q" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to regenerate X authority
regenerate_xauth() {
    log_message "Regenerating X authority..."
    
    # Remove old authority files
    rm -f /home/desktop/.Xauthority* 2>/dev/null || true
    rm -f /root/.Xauthority* 2>/dev/null || true
    rm -f /tmp/.X11-unix/X1 2>/dev/null || true
    
    # Generate new X authority
    su - desktop -c "xauth generate $VNC_DISPLAY . trusted" 2>/dev/null || true
    
    # Copy to root for AI agent
    if [ -f /home/desktop/.Xauthority ]; then
        cp /home/desktop/.Xauthority /root/.Xauthority
        chmod 600 /root/.Xauthority
        log_message "X authority regenerated successfully"
        return 0
    else
        log_message "Failed to regenerate X authority"
        return 1
    fi
}

# Function to kill VNC server completely
kill_vnc_server() {
    log_message "Killing existing VNC server..."
    
    # Kill all VNC related processes (handle both Xvnc and Xtigervnc)
    pkill -f "X.*vnc.*:1" 2>/dev/null || true
    pkill -f "Xtigervnc.*:1" 2>/dev/null || true
    pkill -f "Xvnc :1" 2>/dev/null || true
    pkill -f "vncserver" 2>/dev/null || true
    pkill -f "x11vnc" 2>/dev/null || true
    
    # Wait for processes to die
    sleep 2
    
    # Force kill if still running
    pkill -9 -f "X.*vnc.*:1" 2>/dev/null || true
    pkill -9 -f "Xtigervnc.*:1" 2>/dev/null || true
    pkill -9 -f "Xvnc :1" 2>/dev/null || true
    
    # Clean up lock files
    rm -f /tmp/.X1-lock 2>/dev/null || true
    rm -f /tmp/.X11-unix/X1 2>/dev/null || true
    rm -f /home/desktop/.vnc/*.pid 2>/dev/null || true
    rm -f /home/desktop/.vnc/*.log 2>/dev/null || true
    
    log_message "VNC server killed and cleaned up"
}

# Function to start VNC server with retry logic
start_vnc_server() {
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        log_message "Starting VNC server (attempt $((retries+1))/$MAX_RETRIES)..."
        
        # Ensure VNC directory exists
        mkdir -p /home/desktop/.vnc
        chown -R desktop:desktop /home/desktop/.vnc
        
        # Set VNC password if needed
        if [ ! -f /home/desktop/.vnc/passwd ]; then
            if [ -n "$VNC_PASSWORD" ]; then
                echo "$VNC_PASSWORD" | su - desktop -c "vncpasswd -f > /home/desktop/.vnc/passwd"
            else
                echo "password" | su - desktop -c "vncpasswd -f > /home/desktop/.vnc/passwd"
            fi
            chmod 600 /home/desktop/.vnc/passwd
            chown desktop:desktop /home/desktop/.vnc/passwd
        fi
        
        # Start VNC server (capture output but don't rely on return code)
        VNC_OUTPUT=$(su - desktop -c "vncserver $VNC_DISPLAY -geometry $VNC_RESOLUTION -depth $VNC_DEPTH -SecurityTypes VncAuth -PasswordFile /home/desktop/.vnc/passwd" 2>&1)
        echo "$VNC_OUTPUT" | tee -a "$LOG_FILE"
        
        # Wait a bit for VNC to fully initialize
        sleep 3
        
        # Check if VNC server is actually running (don't trust vncserver exit code)
        # Check for both Xvnc and Xtigervnc
        if pgrep -f "X.*vnc.*:1" >/dev/null || pgrep -f "Xtigervnc.*:1" >/dev/null; then
            log_message "VNC server process detected, verifying display..."
            
            # Verify X server is responding
            if check_x_server "$VNC_DISPLAY"; then
                log_message "VNC server started successfully and X server is responding"
                
                # Regenerate X authority after VNC start
                regenerate_xauth
                
                # Apply display settings
                su - desktop -c "DISPLAY=$VNC_DISPLAY xset s off" 2>/dev/null || true
                su - desktop -c "DISPLAY=$VNC_DISPLAY xset -dpms" 2>/dev/null || true
                su - desktop -c "DISPLAY=$VNC_DISPLAY xset s noblank" 2>/dev/null || true
                
                return 0
            else
                log_message "VNC process running but X server not responding"
            fi
        else
            log_message "VNC server process not found"
        fi
        
        log_message "VNC server start failed, retrying..."
        kill_vnc_server
        retries=$((retries+1))
        sleep $RETRY_DELAY
    done
    
    log_message "ERROR: Failed to start VNC server after $MAX_RETRIES attempts"
    return 1
}

# Function to restart display environment
restart_display() {
    log_message "=== Starting display recovery ==="
    
    # Step 1: Kill existing VNC server
    kill_vnc_server
    
    # Step 2: Start VNC server
    if ! start_vnc_server; then
        log_message "ERROR: Failed to restart VNC server"
        return 1
    fi
    
    # Step 3: Wait for X server to be ready
    local wait_count=0
    while [ $wait_count -lt 30 ]; do
        if check_x_server "$VNC_DISPLAY"; then
            log_message "X server is ready"
            break
        fi
        wait_count=$((wait_count+1))
        sleep 1
    done
    
    if [ $wait_count -eq 30 ]; then
        log_message "WARNING: X server may not be fully ready"
    fi
    
    # Step 4: Restart window manager if needed
    if ! pgrep -f "xfce4-session" >/dev/null; then
        log_message "Restarting XFCE session..."
        su - desktop -c "DISPLAY=$VNC_DISPLAY startxfce4 &" 2>/dev/null || true
    fi
    
    log_message "=== Display recovery complete ==="
    return 0
}

# Function to check display health
check_display_health() {
    local healthy=true
    local issues=""
    
    # Check if VNC server is running (both Xvnc and Xtigervnc)
    if ! pgrep -f "X.*vnc.*:1" >/dev/null && ! pgrep -f "Xtigervnc.*:1" >/dev/null; then
        log_message "WARNING: VNC server process not found"
        issues="${issues}no-vnc-process "
        healthy=false
    fi
    
    # Check if X server responds (most important check)
    if ! check_x_server "$VNC_DISPLAY"; then
        log_message "WARNING: X server is not responding to queries"
        issues="${issues}x-server-unresponsive "
        healthy=false
    else
        # If X server responds, that's usually good enough
        # Only do screenshot test if other checks passed
        if [ "$healthy" = true ] && command -v scrot >/dev/null 2>&1; then
            if ! su - desktop -c "DISPLAY=$VNC_DISPLAY scrot -z /tmp/test_screenshot.png" 2>/dev/null; then
                log_message "WARNING: Screenshot test failed (may be transient)"
                # Don't mark as unhealthy for screenshot failure alone if X is responding
                # This could be a temporary issue
            else
                rm -f /tmp/test_screenshot.png 2>/dev/null || true
            fi
        fi
    fi
    
    # Additional check: verify .Xauthority exists and is readable
    if [ ! -f /home/desktop/.Xauthority ]; then
        log_message "WARNING: .Xauthority file missing"
        issues="${issues}no-xauth "
        healthy=false
    fi
    
    if [ "$healthy" = true ]; then
        return 0
    else
        log_message "Display health check failed with issues: $issues"
        return 1
    fi
}

# Main function
main() {
    case "${1:-check}" in
        check)
            if check_display_health; then
                log_message "Display health check passed"
                exit 0
            else
                log_message "Display health check failed"
                exit 1
            fi
            ;;
        
        recover)
            restart_display
            exit $?
            ;;
        
        regenerate-auth)
            regenerate_xauth
            exit $?
            ;;
        
        monitor)
            # Continuous monitoring mode
            log_message "Starting display monitor..."
            while true; do
                if ! check_display_health; then
                    log_message "Display health check failed, attempting recovery..."
                    restart_display
                fi
                sleep 30
            done
            ;;
        
        *)
            echo "Usage: $0 {check|recover|regenerate-auth|monitor}"
            echo "  check           - Check display health"
            echo "  recover         - Recover display environment"
            echo "  regenerate-auth - Regenerate X authority only"
            echo "  monitor         - Continuous monitoring and auto-recovery"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"