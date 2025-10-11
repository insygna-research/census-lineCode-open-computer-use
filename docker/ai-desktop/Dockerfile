# AI-Controlled Desktop Environment
FROM ubuntu:22.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:1
ENV VNC_PORT=5901
ENV WEBSOCKET_PORT=6080
ENV VNC_COL_DEPTH=24
ENV VNC_RESOLUTION=1920x1080
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

# Install base packages
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    sudo \
    git \
    vim \
    nano \
    htop \
    net-tools \
    iputils-ping \
    python3 \
    python3-pip \
    python3-dev \
    python3-tk \
    python3-pil \
    python3-pil.imagetk \
    nodejs \
    npm \
    build-essential \
    dos2unix \
    locales \
    && locale-gen en_US.UTF-8 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install XFCE desktop environment and required tools
RUN apt-get update && apt-get install -y \
    xfce4 \
    xfce4-terminal \
    xfce4-screenshooter \
    xfce4-taskmanager \
    xfce4-clipman-plugin \
    xfce4-cpugraph-plugin \
    xfce4-netload-plugin \
    xfce4-xkb-plugin \
    thunar \
    xfce4-settings \
    xfconf \
    libglib2.0-bin \
    attr \
    x11-xserver-utils \
    dbus-x11 \
    caffeine \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install VNC server
RUN apt-get update && apt-get install -y \
    tigervnc-standalone-server \
    tigervnc-common \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install noVNC for web access
RUN git clone https://github.com/novnc/noVNC.git /opt/novnc \
    && git clone https://github.com/novnc/websockify.git /opt/novnc/utils/websockify \
    && ln -s /opt/novnc/vnc.html /opt/novnc/index.html

# Install Chrome and its dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y \
    google-chrome-stable \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install screenshot and OCR support
RUN apt-get update && apt-get install -y \
    scrot \
    imagemagick \
    gnome-screenshot \
    flameshot \
    xvfb \
    x11-apps \
    x11-utils \
    xdotool \
    wmctrl \
    tesseract-ocr \
    tesseract-ocr-eng \
    libtesseract-dev \
    python3-xlib \
    libx11-dev \
    libxext-dev \
    libxrender-dev \
    libxinerama-dev \
    libxi-dev \
    libxrandr-dev \
    libxcursor-dev \
    libxtst-dev \
    libxkbfile-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages for automation with anti-detection capabilities
RUN pip3 install --no-cache-dir \
    pyautogui==0.9.54 \
    selenium==4.15.2 \
    undetected-chromedriver==3.5.4 \
    selenium-stealth==1.0.6 \
    fake-useragent==1.4.0 \
    playwright \
    playwright-stealth \
    opencv-python-headless==4.8.1.78 \
    Pillow>=9.2.0 \
    requests==2.31.0 \
    websocket-client==1.6.4 \
    websockets==12.0 \
    python-dotenv==1.0.0 \
    pynput==1.7.6 \
    pytesseract==0.3.10 \
    numpy==1.24.3 \
    python-xlib==0.33 \
    mss==9.0.1

# Install Playwright browsers (Chrome only)
RUN playwright install chromium

# Install Chrome WebDriver for Selenium
RUN apt-get update && apt-get install -y \
    chromium-chromedriver \
    && ln -s /usr/bin/chromedriver /usr/local/bin/chromedriver \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create user with proper groups for Chrome
RUN useradd -m -s /bin/bash desktop && \
    echo "desktop:desktop" | chpasswd && \
    usermod -aG sudo,audio,video desktop

# Set up Chrome sandbox requirements and profile directories
RUN mkdir -p /opt/google/chrome && \
    chown root:root /opt/google/chrome && \
    chmod 4755 /opt/google/chrome && \
    mkdir -p /home/desktop/.config/google-chrome && \
    mkdir -p /home/desktop/.config/google-chrome-docker && \
    mkdir -p /home/desktop/.config/google-chrome-docker/Default && \
    mkdir -p /home/desktop/.config/chromium && \
    mkdir -p /etc/opt/chrome/policies/managed && \
    mkdir -p /etc/chromium/policies/managed && \
    chown -R desktop:desktop /home/desktop/.config && \
    chmod -R 755 /home/desktop/.config

# Create secure directories
RUN mkdir -p /opt/.system && chmod 700 /opt/.system && \
    mkdir -p /opt/.ai_core && chmod 700 /opt/.ai_core && \
    mkdir -p /opt/ai_agent && chmod 700 /opt/ai_agent && chown root:root /opt/ai_agent

# Copy and compile Python files in a secure way
COPY ai_agent_server.py /tmp/ai_agent_server.py
COPY stealth_browser.py /tmp/stealth_browser.py
COPY test_imports.py /tmp/test_imports.py
COPY test_anti_detection.py /tmp/test_anti_detection.py
RUN cd /tmp && \
    python3 -O -m py_compile ai_agent_server.py stealth_browser.py test_imports.py test_anti_detection.py && \
    mv __pycache__/*.pyc /opt/.ai_core/ && \
    chmod 400 /opt/.ai_core/*.pyc && \
    chown root:root /opt/.ai_core/*.pyc && \
    rm -rf /tmp/*.py /tmp/__pycache__

# Copy startup scripts with security
COPY --chmod=700 startup.sh /opt/.system/startup.sh
COPY --chmod=700 startup.azure.sh /opt/.system/startup.azure.sh
COPY --chmod=700 entrypoint.sh /opt/.system/entrypoint.sh
COPY --chmod=700 security-hardening.sh /opt/.system/security-hardening.sh
COPY --chmod=755 display_recovery.sh /opt/.system/display_recovery.sh
COPY --chmod=755 vnc_startup.sh /vnc_startup.sh
COPY --chmod=755 novnc-config.sh /novnc-config.sh
COPY --chmod=755 xstartup /opt/xstartup
COPY --chmod=755 keep-screen-alive.sh /opt/keep-screen-alive.sh
COPY requirements.txt /opt/.ai_core/requirements.txt
COPY --chmod=700 start_agent.sh /opt/.ai_core/start_agent.sh
COPY --chmod=755 chrome-wrapper.sh /usr/local/bin/chrome-wrapper
COPY --chmod=755 chrome-auth-wrapper.sh /usr/local/bin/chrome-auth-wrapper
COPY chrome-policies.json /etc/opt/chrome/policies/managed/chrome-policies.json
COPY chrome-policies.json /etc/chromium/policies/managed/chrome-policies.json
COPY master_preferences /opt/google/chrome/master_preferences
COPY master_preferences /usr/share/google-chrome/master_preferences
COPY master_preferences /home/desktop/.config/google-chrome-docker/Default/Preferences
RUN chown desktop:desktop /home/desktop/.config/google-chrome-docker/Default/Preferences && \
    chmod 644 /home/desktop/.config/google-chrome-docker/Default/Preferences && \
    chown -R desktop:desktop /home/desktop/.config/google-chrome-docker

# Fix line endings for all scripts (critical for proper execution)
RUN dos2unix /opt/.system/startup.sh /opt/.system/startup.azure.sh /opt/.system/entrypoint.sh \
    /opt/.system/security-hardening.sh /opt/.system/display_recovery.sh /vnc_startup.sh /novnc-config.sh /opt/xstartup \
    /opt/keep-screen-alive.sh /opt/.ai_core/start_agent.sh /usr/local/bin/chrome-wrapper /usr/local/bin/chrome-auth-wrapper 2>/dev/null || true && \
    chmod +x /opt/.system/startup.sh /opt/.system/startup.azure.sh /opt/.system/entrypoint.sh \
    /opt/.system/security-hardening.sh /opt/.system/display_recovery.sh /vnc_startup.sh /novnc-config.sh /opt/xstartup \
    /opt/keep-screen-alive.sh /opt/.ai_core/start_agent.sh /usr/local/bin/chrome-wrapper /usr/local/bin/chrome-auth-wrapper

# Create secure wrapper for AI agent
RUN echo '#!/bin/bash' > /opt/.ai_core/run.sh && \
    echo 'cd /opt/.ai_core' >> /opt/.ai_core/run.sh && \
    echo 'export DISPLAY=:1' >> /opt/.ai_core/run.sh && \
    echo 'export XAUTHORITY=/root/.Xauthority' >> /opt/.ai_core/run.sh && \
    echo 'export PYAUTOGUI_FAILSAFE=0' >> /opt/.ai_core/run.sh && \
    echo 'python3 ai_agent_server.cpython-310.opt-1.pyc 2>&1' >> /opt/.ai_core/run.sh && \
    chmod 700 /opt/.ai_core/run.sh && \
    chown root:root /opt/.ai_core/run.sh

# Install AI agent dependencies and setup logging
WORKDIR /opt/.ai_core
RUN pip3 install -r requirements.txt && \
    # Create log directory with proper permissions
    mkdir -p /var/log && \
    touch /var/log/ai_agent.log && \
    chmod 666 /var/log/ai_agent.log && \
    chown desktop:desktop /var/log/ai_agent.log && \
    # Remove the old ai_agent directory if it exists
    rm -rf /opt/ai_agent

# Also copy the Python source files for fallback imports
COPY ai_agent_server.py /opt/.ai_core/ai_agent_server.py
COPY stealth_browser.py /opt/.ai_core/stealth_browser.py
COPY test_anti_detection.py /opt/.ai_core/test_anti_detection.py
RUN chmod 644 /opt/.ai_core/*.py && \
    chown root:root /opt/.ai_core/*.py

# Set up VNC directory as desktop user
USER desktop
RUN mkdir -p /home/desktop/.vnc && \
    mkdir -p /home/desktop/Desktop && \
    mkdir -p /home/desktop/.config/autostart && \
    touch "/home/desktop/.config/google-chrome-docker/First Run"

# Add aliases for easy command line access
RUN echo "alias chrome='/usr/local/bin/chrome-wrapper'" >> /home/desktop/.bashrc && \
    echo "alias google-chrome='/usr/local/bin/chrome-wrapper'" >> /home/desktop/.bashrc && \
    echo "alias chrome-auth='/usr/local/bin/chrome-auth-wrapper'" >> /home/desktop/.bashrc

USER root

# Expose ports (VNC, noVNC, SSH, AI Agent WebSocket, Chrome DevTools)
EXPOSE 5901 6080 22 8080 9222

# Ensure startup script runs as root (it will switch to desktop user internally)
WORKDIR /home/desktop

# Set environment variable for Azure detection (optional, can be set at runtime)
ENV AZURE_CONTAINER_INSTANCE=""

# Start services with entrypoint that detects environment
ENTRYPOINT ["/bin/bash", "/opt/.system/entrypoint.sh"]