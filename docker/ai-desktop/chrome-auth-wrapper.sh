#!/bin/bash
# Chrome wrapper for authentication-friendly mode
# This version removes security-bypassing flags that trigger Google's bot detection

# Set display if not set
export DISPLAY=${DISPLAY:-:1}

# Chrome flags compatible with Google sign-in
# Removed: --disable-web-security, --ignore-certificate-errors, automation flags
CHROME_AUTH_FLAGS="
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
--disable-features=TranslateUI,PrivacySandboxSettings4,ChromeWhatsNewUI,MediaRouter,OptimizationHints,InterestFeedContentSuggestions
--window-size=1920,1080
--window-position=0,0
--user-data-dir=/home/desktop/.config/google-chrome-auth
--disable-infobars
--disable-session-crashed-bubble
--disable-component-update
--disable-domain-reliability
--disable-default-apps
--disable-popup-blocking
--disable-prompt-on-repost
--disable-component-extensions-with-background-pages
--password-store=basic
--use-mock-keychain
--user-agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
--start-maximized
--disable-features=UserAgentClientHint
--force-color-profile=srgb
--metrics-recording-only
--mute-audio
--hide-scrollbars
--enable-features=NetworkService,NetworkServiceInProcess
--disable-features=VizDisplayCompositor
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

# Clean up lock files and set preferences for auth profile
USER_DATA_DIR="/home/desktop/.config/google-chrome-auth"
mkdir -p "$USER_DATA_DIR"
mkdir -p "$USER_DATA_DIR/Default"
rm -f "$USER_DATA_DIR/SingletonLock" 2>/dev/null || true
rm -f "$USER_DATA_DIR/SingletonCookie" 2>/dev/null || true
rm -f "$USER_DATA_DIR/SingletonSocket" 2>/dev/null || true

# Create minimal preferences for authentication
cat > "$USER_DATA_DIR/Default/Preferences" << 'PREFS_EOF'
{
  "browser": {
    "show_home_button": false,
    "check_default_browser": false,
    "has_seen_welcome_page": true,
    "should_reset_check_default_browser": false
  },
  "distribution": {
    "suppress_first_run_bubble": true,
    "suppress_first_run_default_browser_prompt": true,
    "skip_first_run_ui": true,
    "show_welcome_page": false
  },
  "first_run_tabs": [],
  "homepage": "about:blank",
  "homepage_is_newtabpage": false,
  "profile": {
    "default_content_setting_values": {
      "notifications": 2
    },
    "exit_type": "Normal",
    "exited_cleanly": true
  },
  "signin": {
    "allowed": true
  }
}
PREFS_EOF

# Create Local State file for auth profile
cat > "$USER_DATA_DIR/Local State" << 'LOCAL_EOF'
{
  "background_mode": {
    "enabled": false
  },
  "hardware_acceleration_mode": {
    "enabled": false
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

# Create First Run file
touch "$USER_DATA_DIR/First Run"

# Set proper ownership
chown -R desktop:desktop "$USER_DATA_DIR"

# Check if we're running as root and switch to desktop user if needed
if [ "$(id -u)" = "0" ]; then
    # Running as root, switch to desktop user
    exec su - desktop -c "cd /home/desktop && DISPLAY=$DISPLAY /usr/bin/google-chrome-stable $CHROME_AUTH_FLAGS $*"
else
    # Already running as desktop user
    exec /usr/bin/google-chrome-stable $CHROME_AUTH_FLAGS "$@"
fi