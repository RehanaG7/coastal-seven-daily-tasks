import io
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image

# Ensure Day-09 root is in sys.path
DAY_09_DIR = Path(__file__).resolve().parent.parent
if str(DAY_09_DIR) not in sys.path:
    sys.path.insert(0, str(DAY_09_DIR))

from main import app  # noqa: E402


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_image():
    """Generates a valid 100x100 PNG image in memory for testing."""
    image_bytes = io.BytesIO()
    image = Image.new("RGB", (100, 100), color="blue")
    image.save(image_bytes, format="PNG")
    image_bytes.seek(0)
    return image_bytes.getvalue()


@pytest.fixture
def sample_large_image():
    """Generates an image that simulates size requirements."""
    image_bytes = io.BytesIO()
    image = Image.new("RGB", (600, 600), color="red")
    image.save(image_bytes, format="JPEG")
    image_bytes.seek(0)
    return image_bytes.getvalue()
