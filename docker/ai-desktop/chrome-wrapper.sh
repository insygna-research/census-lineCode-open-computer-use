#!/bin/bash
# Chrome wrapper script for Docker container

# Set display if not set
export DISPLAY=${DISPLAY:-:1}

# Chrome flags for container compatibility with anti-bot detection
# Note: --no-sandbox is required in Docker containers
# Anti-detection flags are added to prevent bot detection
CHROME_FLAGS="
--no-sandbox
--disable-setuid-sandbox
--disable-dev-shm-usage
--disable-gpu
--no-first-run
--no-default-browser-check
--disable-translate
--disable-extensions
--disable-background-timer-throttling
--disable-backgrounding-occluded-windows
--disable-renderer-backgrounding
--disable-features=TranslateUI,PrivacySandboxSettings4,ChromeWhatsNewUI,MediaRouter,OptimizationHints,InterestFeedContentSuggestions,IsolateOrigins,site-per-process
--disable-ipc-flooding-protection
--window-size=1920,1080
--window-position=0,0
--user-data-dir=/home/desktop/.config/google-chrome-docker
--remote-debugging-port=9222
--remote-debugging-address=0.0.0.0
--disable-infobars
--disable-session-crashed-bubble
--disable-component-update
--disable-domain-reliability
--disable-default-apps
--disable-popup-blocking
--disable-prompt-on-repost
--disable-client-side-phishing-detection
--disable-component-extensions-with-background-pages
--password-store=basic
--use-mock-keychain
--ignore-certificate-errors
--disable-web-security
--disable-blink-features=AutomationControlled
--exclude-switches=enable-automation
--user-agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
--start-maximized
--disable-features=UserAgentClientHint
--force-color-profile=srgb
--metrics-recording-only
--mute-audio
--hide-scrollbars
--enable-features=NetworkService,NetworkServiceInProcess
--disable-features=VizDisplayCompositor
--disable-features=IsolateOrigins,site-per-process
--disable-features=BlockInsecurePrivateNetworkRequests
--disable-features=OutOfBlinkCors
--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure
--disable-features=CrossSiteDocumentBlockingIfIsolating,CrossSiteDocumentBlockingAlways
--disable-features=ImprovedCookieControls
--disable-features=LazyFrameLoading
--disable-features=GlobalMediaControls
--disable-features=DestroyProfileOnBrowserClose
--disable-features=MediaRouter
--disable-features=DialMediaRouteProvider
--disable-features=AcceptCHFrame
--disable-features=AutoExpandDetailsElement
--disable-features=CertificateTransparencyComponentUpdater
--disable-features=AvoidUnnecessaryBeforeUnloadCheckSync
--disable-features=Translate
"

# Kill any existing Chrome processes
pkill -f chrome || true

# Clean up lock files and set preferences
USER_DATA_DIR="/home/desktop/.config/google-chrome-docker"
mkdir -p "$USER_DATA_DIR"
mkdir -p "$USER_DATA_DIR/Default"
rm -f "$USER_DATA_DIR/SingletonLock" 2>/dev/null || true
rm -f "$USER_DATA_DIR/SingletonCookie" 2>/dev/null || true
rm -f "$USER_DATA_DIR/SingletonSocket" 2>/dev/null || true

# Create Chrome preferences file to disable popups and What's New
cat > "$USER_DATA_DIR/Default/Preferences" << 'PREFS_EOF'
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
cat > "$USER_DATA_DIR/Local State" << 'LOCAL_EOF'
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
  }
}
LOCAL_EOF

# Create First Run file to prevent first run experience
touch "$USER_DATA_DIR/First Run"

# Set proper ownership
chown -R desktop:desktop "$USER_DATA_DIR"

# Check if we're running as root and switch to desktop user if needed
if [ "$(id -u)" = "0" ]; then
    # Running as root, switch to desktop user
    exec su - desktop -c "cd /home/desktop && DISPLAY=$DISPLAY /usr/bin/google-chrome-stable $CHROME_FLAGS $*"
else
    # Already running as desktop user
    exec /usr/bin/google-chrome-stable $CHROME_FLAGS "$@"
fi