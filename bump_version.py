import sys
import json
import re
from pathlib import Path

def bump(level: str = "patch") -> str:
    version_file = Path("version.json")
    if not version_file.exists():
        data = {"version": "1.0.0", "name": "circuit_analyzer"}
    else:
        with open(version_file, "r", encoding="utf-8") as f:
            data = json.load(f)

    cur_version = data.get("version", "1.0.0")
    parts = cur_version.split(".")
    while len(parts) < 3:
        parts.append("0")

    major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])

    if level == "major":
        major += 1
        minor = 0
        patch = 0
    elif level == "minor":
        minor += 1
        patch = 0
    else: # patch
        patch += 1

    new_version = f"{major}.{minor}.{patch}"
    data["version"] = new_version

    with open(version_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    # Actualizar frontend/package.json si existe
    pkg_file = Path("frontend/package.json")
    if pkg_file.exists():
        with open(pkg_file, "r", encoding="utf-8") as f:
            pkg_data = json.load(f)
        pkg_data["version"] = new_version
        with open(pkg_file, "w", encoding="utf-8") as f:
            json.dump(pkg_data, f, indent=2)

    # Actualizar backend/main.py si existe
    main_file = Path("backend/main.py")
    if main_file.exists():
        content = main_file.read_text(encoding="utf-8")
        updated = re.sub(r'version="[^"]+"', f'version="{new_version}"', content)
        main_file.write_text(updated, encoding="utf-8")

    return new_version

if __name__ == "__main__":
    level = sys.argv[1] if len(sys.argv) > 1 else "patch"
    new_ver = bump(level)
    print(new_ver)
