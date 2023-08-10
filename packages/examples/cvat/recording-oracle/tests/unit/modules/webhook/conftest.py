import pytest
import json


@pytest.fixture
def intermediate_results(resource_path, resource_path_root):
    with open(resource_path_root / "recording_oracle_dummy_input.json") as f:
        return json.load(f)
