#!/bin/bash

echo "==================================="
echo "AI Desktop Container Health Check"
echo "==================================="
echo "Time: $(date)"
echo ""

# Check VNC
echo "1. VNC Server Status:"
if pgrep -x "Xtigervnc" > /dev/null; then
    echo "   ✓ VNC server is running"
    echo "   Port: $(netstat -tlnp 2>/dev/null | grep :5901 | head -1)"
else
    echo "   ✗ VNC server is NOT running"
fi
echo ""

# Check noVNC
echo "2. noVNC WebSocket Proxy:"
if pgrep -f "websockify" > /dev/null; then
    echo "   ✓ noVNC proxy is running"
    echo "   Port: $(netstat -tlnp 2>/dev/null | grep :6080 | head -1)"
else
    echo "   ✗ noVNC proxy is NOT running"
fi
echo ""

# Check AI Agent
echo "3. AI Agent Server:"
# Check if AI agent is running (check port as primary indicator)
if netstat -tlnp 2>/dev/null | grep -q ":8080.*LISTEN"; then
    echo "   ✓ AI agent is running"
    # Try to find the PID
    AI_PID=$(netstat -tlnp 2>/dev/null | grep ":8080" | awk '{print $7}' | cut -d'/' -f1)
    if [ -n "$AI_PID" ]; then
        echo "   PID: $AI_PID"
    fi
    
    # Check if port 8080 is listening
    if netstat -tlnp 2>/dev/null | grep -q :8080; then
        echo "   ✓ Port 8080 is listening"
    else
        echo "   ⚠ Port 8080 is NOT listening (agent may be starting)"
    fi
    
    # Check log file
    if [ -f /var/log/ai_agent.log ]; then
        echo "   Recent logs:"
        tail -5 /var/log/ai_agent.log | sed 's/^/   | /'
    fi
else
    echo "   ✗ AI agent is NOT running"
    
    # Try to see why
    if [ -f /var/log/ai_agent_startup.log ]; then
        echo "   Startup errors:"
        tail -5 /var/log/ai_agent_startup.log | sed 's/^/   | /'
    fi
    
    echo ""
    echo "   Attempting to restart AI agent..."
    nohup /opt/.ai_core/start_agent.sh > /var/log/ai_agent_restart.log 2>&1 &
    sleep 3
    
    if netstat -tlnp 2>/dev/null | grep -q ":8080.*LISTEN"; then
        echo "   ✓ AI agent restarted successfully"
    else
        echo "   ✗ Failed to restart AI agent"
        echo "   Check /var/log/ai_agent_restart.log for details"
    fi
fi
echo ""

# Check ports
echo "4. Network Ports:"
echo "   Open ports:"
netstat -tlnp 2>/dev/null | grep LISTEN | awk '{print "   - "$4}' | sort -u
echo ""

# Check X11
echo "5. X11 Display:"
if DISPLAY=:1 xset q > /dev/null 2>&1; then
    echo "   ✓ X11 display :1 is accessible"
else
    echo "   ✗ X11 display :1 is NOT accessible"
fi
echo ""

# System resources
echo "6. System Resources:"
echo "   CPU: $(top -bn1 | grep "Cpu(s)" | head -1)"
echo "   Memory: $(free -h | grep "^Mem:" | awk '{print "Total: "$2", Used: "$3", Free: "$4}')"
echo "   Disk: $(df -h / | tail -1 | awk '{print "Used: "$3" of "$2" ("$5")"}')"
echo ""

echo "==================================="
echo "Health Check Complete"
echo "===================================" 