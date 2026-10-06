import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["TESTING"] = "1"

from core.database import Base, get_db  # noqa: E402
from core.redis import InMemoryRedis, get_redis_client  # noqa: E402
from main import app  # noqa: E402

TEST_DB_URL = "sqlite:///./test_ecommerce.db"
engine = create_engine(
    TEST_DB_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)
test_redis = InMemoryRedis()


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def override_get_redis():
    return test_redis


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_redis_client] = override_get_redis


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists("./test_ecommerce.db"):
        try:
            os.remove("./test_ecommerce.db")
        except PermissionError:
            pass


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_token(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@example.com",
            "password": "adminpass123",
            "role": "admin",
        },
    )
    res = client.post(
        "/api/v1/auth/token",
        data={"username": "admin@example.com", "password": "adminpass123"},
    )
    return res.json()["access_token"]


@pytest.fixture
def user_token(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.com",
            "password": "userpass123",
            "role": "user",
        },
    )
    res = client.post(
        "/api/v1/auth/token",
        data={"username": "user@example.com", "password": "userpass123"},
    )
    return res.json()["access_token"]
