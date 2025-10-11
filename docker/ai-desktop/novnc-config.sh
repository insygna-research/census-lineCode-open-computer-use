#!/bin/bash

# Configure noVNC for cross-origin access
cat > /opt/novnc/utils/websockify/websockify/http.py.patch << 'EOF'
--- http.py.orig
+++ http.py
@@ -100,6 +100,11 @@
         self.send_response(200)
         self.send_header("Content-Type", ctype)
         self.send_header("Content-Length", str(len(response)))
+        # Add CORS headers for cross-origin access
+        self.send_header("Access-Control-Allow-Origin", "*")
+        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
+        self.send_header("Access-Control-Allow-Headers", "Content-Type")
+        self.send_header("X-Frame-Options", "ALLOWALL")
         self.end_headers()
         self.wfile.write(response)
EOF

# Apply patch if file exists and not already patched
if [ -f /opt/novnc/utils/websockify/websockify/http.py ]; then
    cd /opt/novnc/utils/websockify/websockify
    # Check if patch is already applied
    if ! grep -q "Access-Control-Allow-Origin" http.py 2>/dev/null; then
        patch -p0 -N < ../http.py.patch 2>/dev/null || echo "Note: CORS patch could not be applied (non-critical)"
    else
        echo "CORS headers already present in http.py"
    fi
else
    echo "Note: websockify http.py not found at expected location (non-critical)"
fi

# Create a custom index.html that works better with iframes
cat > /opt/novnc/vnc_iframe.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Remote Desktop</title>
    <meta charset="utf-8">
    <style>
        body { margin: 0; overflow: hidden; }
        #screen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; }
    </style>
    <!-- noVNC -->
    <script type="module" crossorigin="anonymous">
        import RFB from './core/rfb.js';
        
        // Get connection parameters
        const params = new URLSearchParams(window.location.search);
        const host = params.get('host') || window.location.hostname;
        const port = params.get('port') || '6080';
        const password = params.get('password') || '';
        const path = params.get('path') || 'websockify';
        const encrypt = params.get('encrypt') === '1';
        const viewOnly = params.get('view_only') === '1';
        
        // Build WebSocket URL
        const protocol = encrypt ? 'wss' : 'ws';
        const url = `${protocol}://${host}:${port}/${path}`;
        
        // Connect
        const rfb = new RFB(
            document.getElementById('screen'),
            url,
            {
                credentials: { password: password },
                shared: true,
                viewOnly: viewOnly,
                scaleViewport: true,
                resizeSession: false,
            }
        );
        
        // Event handlers
        rfb.addEventListener('connect', () => {
            console.log('Connected to VNC server');
            window.parent.postMessage({ type: 'vnc-connected' }, '*');
        });
        
        rfb.addEventListener('disconnect', (e) => {
            console.log('Disconnected from VNC server:', e.detail);
            window.parent.postMessage({ type: 'vnc-disconnected', detail: e.detail }, '*');
        });
        
        rfb.addEventListener('credentialsrequired', () => {
            rfb.sendCredentials({ password: password });
        });
        
        // Expose RFB instance for parent window control
        window.rfb = rfb;
    </script>
</head>
<body>
    <div id="screen"></div>
</body>
</html>
EOF

echo "noVNC configuration completed"