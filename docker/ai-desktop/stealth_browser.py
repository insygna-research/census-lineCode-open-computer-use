#!/usr/bin/env python3
"""
Stealth Browser Module - Anti-detection browser management
Provides undetected browser instances for web automation
"""

import os
import random
import time
import json
import logging
from typing import Optional, Dict, Any, List
from pathlib import Path

try:
    import undetected_chromedriver as uc
except ImportError:
    import selenium.webdriver as uc
    print("Warning: undetected-chromedriver not available, falling back to regular selenium")

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import WebDriverException, TimeoutException
from selenium_stealth import stealth
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)

class StealthBrowser:
    """Enhanced browser with anti-detection capabilities"""
    
    def __init__(self, headless: bool = False, use_profile: bool = True):
        self.driver = None
        self.headless = headless
        self.use_profile = use_profile
        self.ua = UserAgent()
        self.profile_dir = Path("/home/desktop/.config/chrome-profiles")
        self.current_profile = None
        
    def _get_random_viewport(self) -> tuple:
        """Get random but realistic viewport size"""
        viewports = [
            (1920, 1080), (1366, 768), (1440, 900), (1536, 864),
            (1600, 900), (1280, 720), (1280, 800), (1024, 768),
            (1680, 1050), (1920, 1200), (2560, 1440), (2560, 1080)
        ]
        return random.choice(viewports)
    
    def _get_random_user_agent(self) -> str:
        """Get random realistic user agent"""
        # Use fake-useragent for diverse, real user agents
        return self.ua.random
    
    def _setup_chrome_options(self) -> ChromeOptions:
        """Configure Chrome options for stealth"""
        options = ChromeOptions()
        
        # Get random viewport
        width, height = self._get_random_viewport()
        
        # Basic required flags for Docker
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-setuid-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        # Stealth flags
        options.add_argument('--disable-blink-features=AutomationControlled')
        try:
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)
        except Exception as e:
            logger.warning(f"Could not set experimental options: {e}")
            # Fallback: add as regular arguments
            options.add_argument('--disable-automation')
        
        # Disable automation indicators
        options.add_argument('--disable-infobars')
        options.add_argument('--disable-notifications')
        options.add_argument('--disable-popup-blocking')
        
        # Performance and compatibility
        options.add_argument('--disable-gpu')
        options.add_argument('--disable-software-rasterizer')
        options.add_argument('--disable-extensions')
        options.add_argument('--disable-plugins')
        options.add_argument('--disable-images')  # Optional: faster loading
        options.add_argument('--disable-javascript')  # Optional: can be enabled per site
        
        # Window size with randomization
        options.add_argument(f'--window-size={width},{height}')
        options.add_argument('--window-position=0,0')
        options.add_argument('--start-maximized')
        
        # User agent rotation
        user_agent = self._get_random_user_agent()
        options.add_argument(f'--user-agent={user_agent}')
        
        # Language and locale randomization
        languages = ['en-US', 'en-GB', 'en-CA', 'en-AU', 'en-NZ']
        lang = random.choice(languages)
        options.add_experimental_option('prefs', {
            'intl.accept_languages': lang,
            'profile.default_content_setting_values.notifications': 2,
            'profile.default_content_settings.popups': 0,
            'profile.managed_default_content_settings.images': 1,
            'profile.content_settings.plugin_whitelist.adobe-flash-player': 0,
            'profile.content_settings.exceptions.plugins.*,*.per_resource.adobe-flash-player': 0,
            'credentials_enable_service': False,
            'profile.password_manager_enabled': False,
            'safebrowsing.enabled': False,
            'safebrowsing.disable_download_protection': True,
            'download.prompt_for_download': False,
            'download.directory_upgrade': True,
            'webrtc.ip_handling_policy': 'disable_non_proxied_udp',
            'webrtc.multiple_routes_enabled': False,
            'webrtc.nonproxied_udp_enabled': False
        })
        
        # Profile management
        if self.use_profile:
            profile_path = self._get_or_create_profile()
            options.add_argument(f'--user-data-dir={profile_path}')
        
        # Remote debugging for automation
        options.add_argument('--remote-debugging-port=9222')
        options.add_argument('--remote-debugging-address=0.0.0.0')
        
        # Additional anti-detection features
        options.add_argument('--disable-features=IsolateOrigins,site-per-process')
        options.add_argument('--disable-features=BlockInsecurePrivateNetworkRequests')
        options.add_argument('--disable-features=OutOfBlinkCors')
        options.add_argument('--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure')
        options.add_argument('--disable-features=CrossSiteDocumentBlockingIfIsolating,CrossSiteDocumentBlockingAlways')
        options.add_argument('--disable-features=ImprovedCookieControls')
        
        if self.headless:
            options.add_argument('--headless')
            options.add_argument('--disable-gpu')
            
        return options
    
    def _get_or_create_profile(self) -> str:
        """Get or create a browser profile for persistence"""
        self.profile_dir.mkdir(parents=True, exist_ok=True)
        
        # Get existing profiles or create new one
        profiles = list(self.profile_dir.glob("profile_*"))
        
        if profiles and random.random() > 0.3:  # 70% chance to reuse profile
            profile = random.choice(profiles)
        else:
            # Create new profile
            profile_num = len(profiles) + 1
            profile = self.profile_dir / f"profile_{profile_num}"
            profile.mkdir(exist_ok=True)
            
        self.current_profile = str(profile)
        return self.current_profile
    
    def create_undetected_driver(self) -> webdriver.Chrome:
        """Create an undetected Chrome driver instance"""
        try:
            options = self._setup_chrome_options()
            
            # Try to use undetected-chromedriver
            try:
                # Use undetected-chromedriver if available
                driver = uc.Chrome(
                    options=options,
                    version_main=None,  # Auto-detect Chrome version
                    driver_executable_path=None,  # Auto-download driver
                )
            except:
                # Fallback to regular Chrome with stealth
                logger.warning("Using regular Chrome with stealth mode")
                driver = webdriver.Chrome(options=options)
                
                # Apply selenium-stealth
                stealth(driver,
                    languages=["en-US", "en"],
                    vendor="Google Inc.",
                    platform="Linux",
                    webgl_vendor="Intel Inc.",
                    renderer="Intel Iris OpenGL Engine",
                    fix_hairline=True,
                )
            
            # Additional CDP commands for stealth
            self._apply_cdp_stealth(driver)
            
            # Store driver instance
            self.driver = driver
            
            return driver
            
        except Exception as e:
            logger.error(f"Failed to create undetected driver: {e}")
            raise
    
    def _apply_cdp_stealth(self, driver):
        """Apply Chrome DevTools Protocol commands for additional stealth"""
        try:
            # Override navigator.webdriver
            driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': '''
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined
                    });
                '''
            })
            
            # Override navigator.plugins
            driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': '''
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => [
                            {
                                0: {type: "application/x-google-chrome-pdf", suffixes: "pdf"},
                                description: "Portable Document Format",
                                filename: "internal-pdf-viewer",
                                length: 1,
                                name: "Chrome PDF Plugin"
                            },
                            {
                                0: {type: "application/pdf", suffixes: "pdf"},
                                description: "Portable Document Format",
                                filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
                                length: 1,
                                name: "Chrome PDF Viewer"
                            },
                            {
                                0: {type: "application/x-nacl", suffixes: ""},
                                1: {type: "application/x-pnacl", suffixes: ""},
                                description: "Native Client Executable",
                                filename: "internal-nacl-plugin",
                                length: 2,
                                name: "Native Client"
                            }
                        ]
                    });
                '''
            })
            
            # Override permissions
            driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': '''
                    const originalQuery = window.navigator.permissions.query;
                    window.navigator.permissions.query = (parameters) => (
                        parameters.name === 'notifications' ?
                            Promise.resolve({ state: Notification.permission }) :
                            originalQuery(parameters)
                    );
                '''
            })
            
            # Override chrome runtime
            driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': '''
                    Object.defineProperty(window, 'chrome', {
                        get: () => ({
                            runtime: {},
                            loadTimes: function() {},
                            csi: function() {},
                            app: {}
                        })
                    });
                '''
            })
            
            # Override language and platform
            driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': '''
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['en-US', 'en']
                    });
                    Object.defineProperty(navigator, 'platform', {
                        get: () => 'Linux x86_64'
                    });
                '''
            })
            
            # Randomize hardware concurrency
            cores = random.choice([2, 4, 6, 8, 12, 16])
            driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': f'''
                    Object.defineProperty(navigator, 'hardwareConcurrency', {{
                        get: () => {cores}
                    }});
                '''
            })
            
            # Override screen properties
            driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': '''
                    Object.defineProperty(screen, 'colorDepth', {
                        get: () => 24
                    });
                    Object.defineProperty(screen, 'pixelDepth', {
                        get: () => 24
                    });
                '''
            })
            
            # Add WebGL noise
            driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': '''
                    const getParameter = WebGLRenderingContext.prototype.getParameter;
                    WebGLRenderingContext.prototype.getParameter = function(parameter) {
                        if (parameter === 37445) {
                            return 'Intel Inc.';
                        }
                        if (parameter === 37446) {
                            return 'Intel Iris OpenGL Engine';
                        }
                        return getParameter.apply(this, arguments);
                    };
                '''
            })
            
            # Add Canvas noise
            driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': '''
                    const toDataURL = HTMLCanvasElement.prototype.toDataURL;
                    HTMLCanvasElement.prototype.toDataURL = function() {
                        const context = this.getContext('2d');
                        const imageData = context.getImageData(0, 0, this.width, this.height);
                        for (let i = 0; i < imageData.data.length; i += 4) {
                            imageData.data[i] = imageData.data[i] + Math.random() * 0.1;
                            imageData.data[i + 1] = imageData.data[i + 1] + Math.random() * 0.1;
                            imageData.data[i + 2] = imageData.data[i + 2] + Math.random() * 0.1;
                        }
                        context.putImageData(imageData, 0, 0);
                        return toDataURL.apply(this, arguments);
                    };
                '''
            })
            
        except Exception as e:
            logger.warning(f"Failed to apply some CDP stealth commands: {e}")
    
    def connect_to_existing(self, port: int = 9222) -> webdriver.Chrome:
        """Connect to an existing Chrome instance with debugging port"""
        try:
            options = ChromeOptions()
            # When connecting to existing Chrome, use debugger_address attribute directly
            # This is more compatible than add_experimental_option
            options.debugger_address = f"127.0.0.1:{port}"
            
            # Add anti-detection arguments that work with existing Chrome
            options.add_argument('--disable-blink-features=AutomationControlled')
            
            # Note: excludeSwitches and useAutomationExtension don't work well 
            # when connecting to an existing Chrome instance
            
            # Connect with stealth
            driver = webdriver.Chrome(options=options)
            
            # Apply CDP stealth commands
            self._apply_cdp_stealth(driver)
            
            self.driver = driver
            return driver
            
        except Exception as e:
            logger.error(f"Failed to connect to existing Chrome: {e}")
            raise
    
    def human_like_delay(self, min_seconds: float = 0.1, max_seconds: float = 2.0):
        """Add human-like random delay between actions"""
        delay = random.uniform(min_seconds, max_seconds)
        time.sleep(delay)
    
    def human_like_mouse_move(self, element):
        """Simulate human-like mouse movement to element"""
        if self.driver:
            try:
                from selenium.webdriver.common.action_chains import ActionChains
                actions = ActionChains(self.driver)
                
                # Get element location
                location = element.location
                size = element.size
                
                # Calculate random point within element
                x_offset = random.randint(size['width'] // 4, 3 * size['width'] // 4)
                y_offset = random.randint(size['height'] // 4, 3 * size['height'] // 4)
                
                # Move with curve (multiple small movements)
                steps = random.randint(3, 7)
                for i in range(steps):
                    intermediate_x = location['x'] + (x_offset * (i + 1) / steps)
                    intermediate_y = location['y'] + (y_offset * (i + 1) / steps)
                    actions.move_by_offset(intermediate_x, intermediate_y)
                    actions.pause(random.uniform(0.01, 0.05))
                
                actions.perform()
            except:
                pass
    
    def human_like_type(self, element, text: str):
        """Type text with human-like delays and patterns"""
        if element:
            element.clear()
            for char in text:
                element.send_keys(char)
                # Vary typing speed
                if char == ' ':
                    time.sleep(random.uniform(0.1, 0.3))
                elif char in '.,!?':
                    time.sleep(random.uniform(0.2, 0.5))
                else:
                    time.sleep(random.uniform(0.05, 0.15))
                
                # Occasional longer pauses (thinking)
                if random.random() < 0.1:
                    time.sleep(random.uniform(0.5, 1.5))
    
    def random_scroll(self):
        """Perform random scrolling like a human browsing"""
        if self.driver:
            try:
                # Get page height
                page_height = self.driver.execute_script("return document.documentElement.scrollHeight")
                viewport_height = self.driver.execute_script("return window.innerHeight")
                
                # Random scroll amount
                scroll_amount = random.randint(100, viewport_height // 2)
                
                # Smooth scroll
                self.driver.execute_script(f"""
                    window.scrollBy({{
                        top: {scroll_amount},
                        behavior: 'smooth'
                    }});
                """)
                
                # Random pause to "read"
                time.sleep(random.uniform(0.5, 3.0))
                
            except:
                pass
    
    def get_driver(self) -> Optional[webdriver.Chrome]:
        """Get the current driver instance"""
        return self.driver
    
    def quit(self):
        """Quit the browser"""
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
            self.driver = None


class BrowserManager:
    """Manage multiple stealth browser instances"""
    
    def __init__(self):
        self.browsers: Dict[str, StealthBrowser] = {}
        
    def create_browser(self, browser_id: str = "default", **kwargs) -> StealthBrowser:
        """Create a new stealth browser instance"""
        browser = StealthBrowser(**kwargs)
        browser.create_undetected_driver()
        self.browsers[browser_id] = browser
        return browser
    
    def get_browser(self, browser_id: str = "default") -> Optional[StealthBrowser]:
        """Get an existing browser instance"""
        return self.browsers.get(browser_id)
    
    def close_browser(self, browser_id: str = "default"):
        """Close a specific browser instance"""
        if browser_id in self.browsers:
            self.browsers[browser_id].quit()
            del self.browsers[browser_id]
    
    def close_all(self):
        """Close all browser instances"""
        for browser_id in list(self.browsers.keys()):
            self.close_browser(browser_id)


# Example usage and testing
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Create stealth browser
    browser = StealthBrowser(headless=False)
    driver = browser.create_undetected_driver()
    
    # Test navigation
    driver.get("https://www.google.com")
    browser.human_like_delay(2, 5)
    
    # Test bot detection sites
    test_sites = [
        "https://bot.sannysoft.com/",
        "https://arh.antoinevastel.com/bots/areyouheadless",
        "https://fingerprint.com/demo/bot-detection/",
    ]
    
    for site in test_sites:
        print(f"Testing: {site}")
        driver.get(site)
        browser.human_like_delay(3, 5)
        browser.random_scroll()
        browser.human_like_delay(2, 4)
    
    print("Stealth browser test completed")
    browser.quit()