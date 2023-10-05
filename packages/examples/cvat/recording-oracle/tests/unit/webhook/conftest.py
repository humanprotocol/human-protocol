import json
from pathlib import Path

import pytest

resource_path_root = Path(__file__).parent.parent.parent / "utils"


@pytest.fixture
def intermediate_results():
    with open(resource_path_root / "recording_oracle_dummy_input.json") as f:
        return json.load(f)
