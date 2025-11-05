from pathlib import Path
import json
import re
import sys

root = Path(__file__).resolve().parents[1]
pkg_json = root / "package.json"
init_py = root / "human_protocol_sdk" / "__init__.py"

try:
    data = json.loads(pkg_json.read_text(encoding="utf-8"))
    ver = data.get("version")
    if not isinstance(ver, str) or not ver.strip():
        raise ValueError("Missing or empty 'version' in package.json")
except Exception as e:
    print(f"[embed_version] Error reading {pkg_json}: {e}", file=sys.stderr)
    sys.exit(1)

src = init_py.read_text(encoding="utf-8")
new, count = re.subn(
    r'^__version__\s*=\s*["\'].*?["\']\s*$',
    f'__version__ = "{ver}"',
    src,
    flags=re.MULTILINE,
)
print(f"[embed_version] Found {count} existing __version__ entries in {init_py}")
if count == 0:
    new = src.rstrip() + f'__version__ = "{ver}"\n'

init_py.write_text(new, encoding="utf-8")
