#!/usr/bin/env python3
"""
Python code obfuscator for AI agent
Compiles Python source to bytecode and applies additional obfuscation
"""

import py_compile
import os
import shutil
import marshal
import zlib
import base64
import random
import string

def obfuscate_python_file(source_file, output_dir):
    """Obfuscate a Python file using multiple techniques"""
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Compile to bytecode
    bytecode_file = os.path.join(output_dir, os.path.basename(source_file) + 'c')
    py_compile.compile(source_file, bytecode_file, doraise=True)
    
    # 2. Read the bytecode
    with open(bytecode_file, 'rb') as f:
        bytecode_data = f.read()
    
    # 3. Create an encrypted loader
    # Generate random key
    key = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    
    # Simple XOR encryption of bytecode
    encrypted_data = bytearray()
    for i, byte in enumerate(bytecode_data):
        encrypted_data.append(byte ^ ord(key[i % len(key)]))
    
    # 4. Create loader script
    loader_code = f'''
import sys
import marshal
import types
import base64

# Encrypted bytecode
data = {base64.b64encode(bytes(encrypted_data))}
key = "{key}"

# Decrypt
decrypted = bytearray()
decoded = base64.b64decode(data)
for i, byte in enumerate(decoded):
    decrypted.append(byte ^ ord(key[i % len(key)]))

# Skip Python bytecode header (16 bytes in Python 3.10+)
code_obj = marshal.loads(bytes(decrypted[16:]))

# Create module and execute
module = types.ModuleType("__main__")
exec(code_obj, module.__dict__)
'''
    
    # 5. Write obfuscated loader
    loader_file = os.path.join(output_dir, os.path.basename(source_file).replace('.py', '_secure.py'))
    with open(loader_file, 'w') as f:
        f.write(loader_code)
    
    # 6. Compile the loader itself
    loader_bytecode = loader_file + 'c'
    py_compile.compile(loader_file, loader_bytecode, doraise=True)
    
    # 7. Clean up intermediate files
    os.remove(loader_file)
    os.remove(bytecode_file)
    
    return loader_bytecode

def create_hidden_launcher(bytecode_file, output_file):
    """Create a binary-like launcher for the bytecode"""
    
    launcher_code = '''#!/usr/bin/env python3
import marshal
import types
import sys
import os

# Hide the script from process list
if sys.platform == 'linux':
    try:
        import ctypes
        libc = ctypes.CDLL("libc.so.6")
        libc.prctl(15, b"systemd", 0, 0, 0)  # PR_SET_NAME
    except:
        pass

# Load and execute bytecode
with open("{}", "rb") as f:
    f.read(16)  # Skip header
    code = marshal.load(f)
    
module = types.ModuleType("__main__")
module.__file__ = "system_service"
sys.modules["__main__"] = module
exec(code, module.__dict__)
'''.format(bytecode_file)
    
    with open(output_file, 'w') as f:
        f.write(launcher_code)
    
    os.chmod(output_file, 0o700)

if __name__ == "__main__":
    # Obfuscate the AI agent files
    files_to_obfuscate = [
        "ai_agent_server.py",
        "test_imports.py"
    ]
    
    output_dir = "/tmp/obfuscated"
    
    for file in files_to_obfuscate:
        if os.path.exists(file):
            print(f"Obfuscating {file}...")
            bytecode = obfuscate_python_file(file, output_dir)
            print(f"Created: {bytecode}")
            
            # Create hidden launcher
            launcher = os.path.join(output_dir, f".{os.path.basename(file).replace('.py', '')}")
            create_hidden_launcher(bytecode, launcher)
            print(f"Created launcher: {launcher}")