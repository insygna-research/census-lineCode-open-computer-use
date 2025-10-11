#!/bin/bash

# Configure XFCE
export XDG_RUNTIME_DIR=/tmp/runtime-desktop
mkdir -p $XDG_RUNTIME_DIR
chmod 700 $XDG_RUNTIME_DIR

# Start XFCE desktop
startxfce4 &

# Configure desktop settings
xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitor0/workspace0/color-style -s 0
xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitor0/workspace0/image-style -s 5
xfconf-query -c xfce4-desktop -p /backdrop/screen0/monitor0/workspace0/last-image -s /usr/share/backgrounds/xfce/xfce-shapes.svg

# Disable screen saver and power management
xset s off
xset -dpms
xset s noblank

# Set desktop resolution
xrandr --output VNC-0 --mode ${VNC_RESOLUTION}

# Start essential services
xfce4-panel &
xfce4-power-manager &

# Keep session alive
exec xfce4-session