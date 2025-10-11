#!/usr/bin/env python3
"""
Test script for anti-detection browser automation
Tests the stealth browser against common bot detection sites
"""

import logging
import time
import sys
import json
from typing import Dict, List, Any

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def _evaluate_bot_test_result(result):
    """Evaluate if bot test passed based on result structure"""
    if isinstance(result, dict):
        # Check for explicit detection flag
        if "detected" in result:
            return not result["detected"]
        # Check for multiple test results
        failed_count = sum(1 for k, v in result.items() if v is False)
        return failed_count < len(result) * 0.3  # Allow up to 30% failures
    return False

def test_stealth_browser():
    """Test the stealth browser implementation"""
    try:
        from stealth_browser import StealthBrowser, BrowserManager
        logger.info("✅ Stealth browser module imported successfully")
    except ImportError as e:
        logger.error(f"❌ Failed to import stealth browser: {e}")
        return False
    
    # Create browser manager
    browser_manager = BrowserManager()
    browser = None
    
    try:
        # Create stealth browser instance
        logger.info("Creating stealth browser instance...")
        browser = StealthBrowser(headless=False, use_profile=True)
        driver = browser.create_undetected_driver()
        logger.info("✅ Stealth browser created successfully")
        
        # Test results
        test_results = {
            "browser_created": True,
            "tests": []
        }
        
        # Test 1: Check basic browser properties
        logger.info("\n🔍 Test 1: Checking browser properties...")
        try:
            # Check navigator.webdriver
            webdriver_check = driver.execute_script("return navigator.webdriver")
            test_results["tests"].append({
                "name": "navigator.webdriver",
                "passed": webdriver_check is None or webdriver_check is False,
                "value": webdriver_check,
                "expected": "undefined or false"
            })
            logger.info(f"  navigator.webdriver: {webdriver_check} {'✅' if not webdriver_check else '❌'}")
            
            # Check user agent
            user_agent = driver.execute_script("return navigator.userAgent")
            has_headless = "Headless" in user_agent or "headless" in user_agent
            test_results["tests"].append({
                "name": "User Agent (no Headless)",
                "passed": not has_headless,
                "value": user_agent[:100],
                "expected": "No 'Headless' in user agent"
            })
            logger.info(f"  User Agent: {user_agent[:80]}... {'✅' if not has_headless else '❌'}")
            
            # Check plugins
            plugins_length = driver.execute_script("return navigator.plugins.length")
            test_results["tests"].append({
                "name": "navigator.plugins",
                "passed": plugins_length > 0,
                "value": plugins_length,
                "expected": "> 0"
            })
            logger.info(f"  Plugins count: {plugins_length} {'✅' if plugins_length > 0 else '❌'}")
            
            # Check languages
            languages = driver.execute_script("return navigator.languages")
            test_results["tests"].append({
                "name": "navigator.languages",
                "passed": len(languages) > 0,
                "value": languages,
                "expected": "Non-empty array"
            })
            logger.info(f"  Languages: {languages} {'✅' if languages else '❌'}")
            
            # Check chrome object
            chrome_exists = driver.execute_script("return typeof window.chrome !== 'undefined'")
            test_results["tests"].append({
                "name": "window.chrome",
                "passed": chrome_exists,
                "value": chrome_exists,
                "expected": "true"
            })
            logger.info(f"  Chrome object exists: {chrome_exists} {'✅' if chrome_exists else '❌'}")
            
            # Check permissions
            permissions_check = driver.execute_script("""
                return new Promise((resolve) => {
                    try {
                        navigator.permissions.query({name: 'notifications'}).then(result => {
                            resolve(result.state);
                        }).catch(e => resolve('error'));
                    } catch(e) {
                        resolve('not_supported');
                    }
                });
            """)
            test_results["tests"].append({
                "name": "permissions.query",
                "passed": permissions_check != 'error',
                "value": permissions_check,
                "expected": "not 'error'"
            })
            logger.info(f"  Permissions API: {permissions_check} {'✅' if permissions_check != 'error' else '❌'}")
            
        except Exception as e:
            logger.error(f"  Error in basic tests: {e}")
            test_results["tests"].append({
                "name": "Basic browser properties",
                "passed": False,
                "error": str(e)
            })
        
        # Test 2: Bot detection sites
        logger.info("\n🔍 Test 2: Testing against bot detection sites...")
        bot_detection_sites = [
            {
                "name": "Sannysoft Bot Test",
                "url": "https://bot.sannysoft.com/",
                "check_script": """
                    const results = {};
                    const rows = document.querySelectorAll('tr');
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 2) {
                            const test = cells[0].innerText.trim();
                            const result = cells[1].className;
                            results[test] = result !== 'failed';
                        }
                    });
                    return results;
                """
            },
            {
                "name": "InCollu Bot Detection",
                "url": "https://www.browserscan.net/bot-detection",
                "check_script": """
                    // Wait for results to load
                    const botScore = document.querySelector('.bot-score');
                    if (botScore) {
                        const score = botScore.innerText;
                        return {
                            detected: score.includes('Bot') || score.includes('Automated'),
                            score: score
                        };
                    }
                    return {detected: null, score: 'Could not determine'};
                """
            },
            {
                "name": "FingerprintJS Demo",
                "url": "https://fingerprint.com/products/bot-detection/",
                "check_script": """
                    // Check if page detects automation
                    const automationElements = document.querySelectorAll('[data-automation], .automation-detected');
                    return {
                        detected: automationElements.length > 0,
                        elements: automationElements.length
                    };
                """
            }
        ]
        
        for site in bot_detection_sites:
            try:
                logger.info(f"\n  Testing: {site['name']}")
                logger.info(f"  URL: {site['url']}")
                
                # Navigate to site
                driver.get(site['url'])
                
                # Human-like delay
                browser.human_like_delay(3, 5)
                
                # Random scroll
                browser.random_scroll()
                browser.human_like_delay(2, 3)
                
                # Execute check script
                result = driver.execute_script(site['check_script'])
                
                test_results["tests"].append({
                    "name": site['name'],
                    "url": site['url'],
                    "result": result,
                    "passed": _evaluate_bot_test_result(result)
                })
                
                logger.info(f"  Result: {json.dumps(result, indent=2)}")
                
                # Take screenshot for verification
                screenshot_name = f"bot_test_{site['name'].replace(' ', '_').lower()}.png"
                driver.save_screenshot(f"/tmp/{screenshot_name}")
                logger.info(f"  Screenshot saved: /tmp/{screenshot_name}")
                
                # Human-like delay before next test
                browser.human_like_delay(1, 2)
                
            except Exception as e:
                logger.error(f"  Error testing {site['name']}: {e}")
                test_results["tests"].append({
                    "name": site['name'],
                    "url": site['url'],
                    "passed": False,
                    "error": str(e)
                })
        
        # Test 3: Human-like behavior
        logger.info("\n🔍 Test 3: Testing human-like behavior...")
        try:
            # Navigate to Google
            driver.get("https://www.google.com")
            browser.human_like_delay(2, 3)
            
            # Find search box
            search_box = driver.find_element("name", "q")
            
            # Human-like typing
            logger.info("  Testing human-like typing...")
            browser.human_like_type(search_box, "OpenAI GPT-4")
            
            # Human-like mouse movement
            logger.info("  Testing human-like mouse movement...")
            browser.human_like_mouse_move(search_box)
            
            # Random scrolling
            logger.info("  Testing random scrolling...")
            for _ in range(3):
                browser.random_scroll()
                browser.human_like_delay(1, 2)
            
            test_results["tests"].append({
                "name": "Human-like behavior",
                "passed": True,
                "details": "Typing, mouse movement, and scrolling completed"
            })
            logger.info("  ✅ Human-like behavior test passed")
            
        except Exception as e:
            logger.error(f"  Error in human-like behavior test: {e}")
            test_results["tests"].append({
                "name": "Human-like behavior",
                "passed": False,
                "error": str(e)
            })
        
        # Summary
        logger.info("\n" + "="*60)
        logger.info("TEST SUMMARY")
        logger.info("="*60)
        
        total_tests = len(test_results["tests"])
        passed_tests = sum(1 for test in test_results["tests"] if test.get("passed", False))
        
        logger.info(f"Total tests: {total_tests}")
        logger.info(f"Passed: {passed_tests}")
        logger.info(f"Failed: {total_tests - passed_tests}")
        logger.info(f"Success rate: {(passed_tests/total_tests*100):.1f}%")
        
        # Save results to file
        with open("/tmp/anti_detection_test_results.json", "w") as f:
            json.dump(test_results, f, indent=2)
        logger.info("\nDetailed results saved to: /tmp/anti_detection_test_results.json")
        
        return passed_tests == total_tests
        
    except Exception as e:
        logger.error(f"Test failed with error: {e}")
        return False
    
    finally:
        # Clean up
        if browser:
            logger.info("\nCleaning up...")
            browser.quit()


def test_connection_to_existing():
    """Test connection to existing Chrome instance"""
    logger.info("\n" + "="*60)
    logger.info("Testing connection to existing Chrome instance")
    logger.info("="*60)
    
    try:
        from stealth_browser import StealthBrowser
        
        # Create browser and connect to existing instance
        browser = StealthBrowser()
        driver = browser.connect_to_existing(port=9222)
        
        logger.info("✅ Connected to existing Chrome instance")
        
        # Test current page
        current_url = driver.current_url
        title = driver.title
        
        logger.info(f"Current URL: {current_url}")
        logger.info(f"Page title: {title}")
        
        # Check stealth properties
        webdriver_check = driver.execute_script("return navigator.webdriver")
        logger.info(f"navigator.webdriver: {webdriver_check} {'✅' if not webdriver_check else '❌'}")
        
        browser.quit()
        return True
        
    except Exception as e:
        logger.error(f"Failed to connect: {e}")
        return False


if __name__ == "__main__":
    logger.info("Starting Anti-Detection Browser Tests")
    logger.info("This will test the stealth browser implementation")
    logger.info("-" * 60)
    
    # Run main stealth browser test
    success = test_stealth_browser()
    
    # Optional: Test connection to existing instance
    # Uncomment if Chrome is already running with debugging port
    # test_connection_to_existing()
    
    if success:
        logger.info("\n✅ All anti-detection tests PASSED!")
        sys.exit(0)
    else:
        logger.info("\n❌ Some anti-detection tests FAILED. Review the results.")
        sys.exit(1)