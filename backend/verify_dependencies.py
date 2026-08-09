import os
import ast
import sys
import pkgutil

# Standard library module names
STDLIB_MODULES = set(sys.builtin_module_names)
for m in pkgutil.iter_modules():
    STDLIB_MODULES.add(m.name)

# Exclude local project packages/modules
LOCAL_EXCLUSIONS = {"app", "tests"}

def parse_requirements(req_path):
    requirements = set()
    if not os.path.exists(req_path):
        return requirements
    with open(req_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Extract package name (handles version constraints like ==, >=, etc.)
            parts = re.split(r'[=><~]', line)
            req_name = parts[0].strip().lower().replace("-", "_")
            requirements.add(req_name)
    return requirements

def get_imported_modules(py_files):
    imports = set()
    for file_path in py_files:
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                tree = ast.parse(f.read(), filename=file_path)
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            imports.add(alias.name.split(".")[0])
                    elif isinstance(node, ast.ImportFrom):
                        if node.level == 0 and node.module:
                            imports.add(node.module.split(".")[0])
            except Exception as e:
                print(f"Warning: Failed to parse {file_path}: {e}")
    return imports

# Standard python mapping for libraries where import name differs from package name
IMPORT_TO_PKG_MAP = {
    "bs4": "beautifulsoup4",
    "sqlalchemy": "sqlalchemy",
    "apscheduler": "apscheduler",
    "yfinance": "yfinance",
    "yaml": "pyyaml",
    "PIL": "pillow",
    "jwt": "pyjwt",
    "dateutil": "python-dateutil"
}

import re

def main():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    req_path = os.path.join(backend_dir, "requirements.txt")
    
    requirements = parse_requirements(req_path)
    # yfinance has some standard transitives, but we list them or maps
    
    # Collect all python files in app/ and main.py
    py_files = []
    for root, _, files in os.walk(os.path.join(backend_dir, "app")):
        for file in files:
            if file.endswith(".py"):
                py_files.append(os.path.join(root, file))
    main_py = os.path.join(backend_dir, "main.py")
    if os.path.exists(main_py):
        py_files.append(main_py)
        
    imported = get_imported_modules(py_files)
    
    missing_deps = []
    for imp in sorted(imported):
        imp_lower = imp.lower()
        # Filter stdlib, local exclusions, and empty module names
        if not imp or imp in STDLIB_MODULES or imp in LOCAL_EXCLUSIONS:
            continue
            
        # Map import name to package name if mapped
        pkg_name = IMPORT_TO_PKG_MAP.get(imp, imp_lower)
        
        # Check if package name is in requirements.txt
        if pkg_name not in requirements:
            # Check for standard sub-dependency or aliases
            if imp_lower not in requirements:
                missing_deps.append((imp, pkg_name))
                
    if missing_deps:
        print("\n" + "=" * 80)
        print("Dependency Validation Failure: Unlisted Python Imports Found!")
        print("=" * 80)
        for imp, pkg in missing_deps:
            print(f"  - Imported module '{imp}' (requires package '{pkg}') is NOT listed in requirements.txt")
        print("\nPlease add these dependencies to requirements.txt to avoid production deployment crashes.")
        print("=" * 80 + "\n")
        sys.exit(1)
    else:
        print("Dependency checks passed successfully! All imported modules are registered in requirements.txt.")
        sys.exit(0)

if __name__ == "__main__":
    main()
