#!/usr/bin/env python3
"""
Test script to verify all Python imports work correctly
"""

import sys
import os

print("=" * 60)
print("Python Environment Test")
print("=" * 60)
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"DISPLAY: {os.environ.get('DISPLAY', 'not set')}")
print(f"PYAUTOGUI_FAILSAFE: {os.environ.get('PYAUTOGUI_FAILSAFE', 'not set')}")
print("-" * 60)

# Test imports one by one
test_results = []

def test_import(module_name, critical=True):
    """Test if a module can be imported"""
    try:
        __import__(module_name)
        print(f"✓ {module_name:<20} - OK")
        test_results.append((module_name, True))
        return True
    except ImportError as e:
        status = "CRITICAL" if critical else "Optional"
        print(f"✗ {module_name:<20} - FAILED ({status}): {e}")
        test_results.append((module_name, False))
        return False

print("\nTesting imports:")
print("-" * 60)

# Critical imports
test_import("asyncio", critical=True)
test_import("websockets", critical=True)
test_import("json", critical=True)
test_import("logging", critical=True)

# PyAutoGUI and dependencies
os.environ['PYAUTOGUI_FAILSAFE'] = '0'
test_import("PIL", critical=False)
test_import("pyautogui", critical=False)

# Optional imports
test_import("cv2", critical=False)
test_import("numpy", critical=False)
test_import("pytesseract", critical=False)
test_import("mss", critical=False)

print("-" * 60)

# Test pyautogui functionality if it imported
try:
    import pyautogui
    print("\nTesting pyautogui functionality:")
    print("-" * 60)
    
    # Disable failsafe
    pyautogui.FAILSAFE = False
    
    # Try to get screen size
    try:
        size = pyautogui.size()
        print(f"✓ Screen size: {size}")
    except Exception as e:
        print(f"✗ Could not get screen size: {e}")
    
    # Try to take a screenshot with different methods
    screenshot_methods = []
    
    # Method 1: PyAutoGUI
    try:
        screenshot = pyautogui.screenshot()
        if screenshot:
            print(f"✓ PyAutoGUI screenshot: {screenshot.size}")
            screenshot_methods.append("pyautogui")
        else:
            print("✗ PyAutoGUI screenshot returned None")
    except Exception as e:
        print(f"✗ PyAutoGUI screenshot failed: {e}")
    
    # Method 2: mss
    try:
        import mss
        with mss.mss() as sct:
            monitor = sct.monitors[1]
            sct_img = sct.grab(monitor)
            print(f"✓ mss screenshot: {sct_img.size}")
            screenshot_methods.append("mss")
    except Exception as e:
        print(f"✗ mss screenshot failed: {e}")
    
    # Method 3: scrot command
    try:
        import subprocess
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.png', delete=True) as tmp:
            result = subprocess.run(['scrot', tmp.name], capture_output=True, timeout=2)
            if result.returncode == 0:
                print(f"✓ scrot command works")
                screenshot_methods.append("scrot")
            else:
                print(f"✗ scrot failed: {result.stderr.decode()}")
    except Exception as e:
        print(f"✗ scrot command failed: {e}")
    
    if screenshot_methods:
        print(f"✓ Available screenshot methods: {', '.join(screenshot_methods)}")
    else:
        print("⚠ WARNING: No screenshot methods available!")
        
except ImportError:
    print("\nPyAutoGUI not available - skipping functionality tests")

print("=" * 60)

# Summary
critical_failures = [name for name, success in test_results if not success and name in ["asyncio", "websockets", "json", "logging"]]
if critical_failures:
    print(f"❌ CRITICAL FAILURES: {', '.join(critical_failures)}")
    print("The AI agent will NOT work without these modules!")
    sys.exit(1)
else:
    print("✅ All critical imports successful")
    print("The AI agent should be able to start")
    sys.exit(0)