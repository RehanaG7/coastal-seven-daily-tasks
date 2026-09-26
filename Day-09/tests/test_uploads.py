

from fastapi import status


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "Day 09 API is running"


def test_upload_image_success(client, sample_image):
    response = client.post(
        "/uploads/image",
        files={"file": ("test_pic.png", sample_image, "image/png")},
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "filename" in data
    assert "thumbnail" in data
    assert data["original_url"].startswith("/static/uploads/")
    assert data["thumbnail_url"].startswith("/static/uploads/")

    # Verify static file serving
    static_res = client.get(data["thumbnail_url"])
    assert static_res.status_code == status.HTTP_200_OK


def test_upload_history(client, sample_image):
    # Upload one image first
    client.post(
        "/uploads/image",
        files={"file": ("history_pic.png", sample_image, "image/png")},
    )
    # Check history endpoint
    response = client.get("/uploads/history")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_upload_invalid_extension(client, sample_image):
    response = client.post(
        "/uploads/image",
        files={"file": ("malicious.exe", sample_image, "image/png")},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Unsupported file extension" in response.json()["detail"]


def test_upload_invalid_mime_type(client, sample_image):
    response = client.post(
        "/uploads/image",
        files={"file": ("test.png", sample_image, "text/plain")},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Invalid content type" in response.json()["detail"]


def test_upload_corrupted_image(client):
    fake_bytes = b"not_a_real_image_data"
    response = client.post(
        "/uploads/image",
        files={"file": ("corrupt.jpg", fake_bytes, "image/jpeg")},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Corrupted or invalid image file" in response.json()["detail"]


def test_upload_exceeds_size_limit(client, sample_image, monkeypatch):
    import routers.uploads

    # Set threshold smaller than our valid sample_image byte size
    monkeypatch.setattr(routers.uploads, "MAX_FILE_SIZE", 10)

    response = client.post(
        "/uploads/image",
        files={"file": ("toolarge.png", sample_image, "image/png")},
    )
    assert response.status_code == 413
    assert "File exceeds maximum allowed size" in response.json()["detail"]
