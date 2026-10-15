"""
Day 22 Capstone Test Suite - Asynchronous Celery AI Background Processing
Verifies background task queuing, progress tracking, and result emission.
"""

import time
import pytest
from fastapi.testclient import TestClient
from main import app
from tasks.task_manager import get_task


def test_trigger_and_poll_ai_reindex_task():
    client = TestClient(app)

    # 1. Trigger asynchronous embedding re-index
    res = client.post("/api/v1/tasks/ai/reindex")
    assert res.status_code == 200
    data = res.json()
    task_id = data["task_id"]
    assert task_id.startswith("ai_reindex_")
    assert data["status"] == "PENDING"

    # 2. Poll task status
    poll_res = client.get(f"/api/v1/tasks/{task_id}")
    assert poll_res.status_code == 200
    task_state = poll_res.json()
    assert task_state["task_id"] == task_id

    # Allow worker thread brief moment to progress
    time.sleep(1.2)
    poll_res_2 = client.get(f"/api/v1/tasks/{task_id}")
    assert poll_res_2.status_code == 200
    task_state_2 = poll_res_2.json()
    assert task_state_2["status"] in ["PROGRESS", "SUCCESS"]
    assert task_state_2["progress"] > 0


def test_trigger_and_poll_ai_bulk_descriptions_task():
    client = TestClient(app)

    # 1. Trigger asynchronous bulk description generation
    res = client.post("/api/v1/tasks/ai/bulk-describe")
    assert res.status_code == 200
    data = res.json()
    task_id = data["task_id"]
    assert task_id.startswith("ai_bulk_desc_")
    assert data["status"] == "PENDING"

    # 2. Poll task status
    poll_res = client.get(f"/api/v1/tasks/{task_id}")
    assert poll_res.status_code == 200
    task_state = poll_res.json()
    assert task_state["task_id"] == task_id
