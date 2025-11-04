from pathlib import Path
import json

_base_dir = Path(__file__).resolve().parent.parent
_pkg_json_path = _base_dir / "package.json"
try:
    with _pkg_json_path.open("r", encoding="utf-8") as f:
        _pkg = json.load(f)
except FileNotFoundError as e:
    raise RuntimeError(f"package.json not found at {_pkg_json_path}") from e
except Exception as e:
    raise RuntimeError("Failed to read package.json") from e

_v = _pkg.get("version")
if not isinstance(_v, str) or not _v.strip():
    raise RuntimeError("Missing or empty 'version' in package.json")

__version__ = _v
