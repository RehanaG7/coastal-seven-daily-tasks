import io
from PIL import Image


# --- 1. AUTHENTICATION (5 Tests) ---
def test_01_register_user(client):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "customer1@example.com",
            "password": "pass",
            "full_name": "Customer One",
        },
    )
    assert res.status_code == 201
    assert res.json()["email"] == "customer1@example.com"


def test_02_register_duplicate_email(client):
    res = client.post(
        "/api/v1/auth/register",
        json={"email": "customer1@example.com", "password": "pass"},
    )
    assert res.status_code == 400


def test_03_login_success(client):
    res = client.post(
        "/api/v1/auth/token",
        data={"username": "customer1@example.com", "password": "pass"},
    )
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_04_login_invalid_password(client):
    res = client.post(
        "/api/v1/auth/token",
        data={"username": "customer1@example.com", "password": "badpass"},
    )
    assert res.status_code == 401


def test_05_read_user_me(client, user_token):
    res = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {user_token}"}
    )
    assert res.status_code == 200
    assert res.json()["email"] == "user@example.com"


# --- 2. PRODUCT MANAGEMENT (6 Tests) ---
def test_06_admin_create_product(client, admin_token):
    res = client.post(
        "/api/v1/products",
        json={"name": "Gaming Laptop", "price": 1200.0, "stock": 10},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    assert res.json()["name"] == "Gaming Laptop"


def test_07_customer_cannot_create_product(client, user_token):
    res = client.post(
        "/api/v1/products",
        json={"name": "Hacked Product", "price": 10.0, "stock": 5},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert res.status_code == 403


def test_08_list_products_and_caching(client):
    res = client.get("/api/v1/products")
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_09_get_single_product(client):
    res = client.get("/api/v1/products/1")
    assert res.status_code == 200
    assert res.json()["id"] == 1


def test_10_update_product(client, admin_token):
    res = client.put(
        "/api/v1/products/1",
        json={"price": 1150.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["price"] == 1150.0


def test_11_upload_product_image(client, admin_token):
    buf = io.BytesIO()
    Image.new("RGB", (100, 100), color="blue").save(buf, format="JPEG")
    buf.seek(0)
    res = client.post(
        "/api/v1/products/1/upload-image",
        files={"file": ("test.jpg", buf, "image/jpeg")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert "image_url" in res.json()


# --- 3. REDIS CART (4 Tests) ---
def test_12_add_item_to_cart(client, user_token):
    res = client.post(
        "/api/v1/cart/items",
        json={"product_id": 1, "quantity": 2},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert res.status_code == 200


def test_13_view_cart(client, user_token):
    res = client.get(
        "/api/v1/cart", headers={"Authorization": f"Bearer {user_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    assert data["grand_total"] == 2300.0


def test_14_add_item_exceeding_stock(client, user_token):
    res = client.post(
        "/api/v1/cart/items",
        json={"product_id": 1, "quantity": 9999},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert res.status_code == 400


def test_15_remove_from_cart(client, user_token):
    res = client.delete(
        "/api/v1/cart/items/1",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert res.status_code == 200
    cart = client.get(
        "/api/v1/cart", headers={"Authorization": f"Bearer {user_token}"}
    ).json()
    assert len(cart["items"]) == 0


# --- 4. ORDER MANAGEMENT & STOCK DECREMENT (5 Tests) ---
def test_16_order_checkout_empty_cart(client, user_token):
    res = client.post(
        "/api/v1/orders", headers={"Authorization": f"Bearer {user_token}"}
    )
    assert res.status_code == 400


def test_17_order_checkout_success_and_stock_deduction(client, user_token):
    client.post(
        "/api/v1/cart/items",
        json={"product_id": 1, "quantity": 2},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    order_res = client.post(
        "/api/v1/orders", headers={"Authorization": f"Bearer {user_token}"}
    )
    assert order_res.status_code == 201
    assert order_res.json()["status"] == "CONFIRMED"

    p = client.get("/api/v1/products/1").json()
    assert p["stock"] == 8


def test_18_get_user_orders(client, user_token):
    res = client.get(
        "/api/v1/orders", headers={"Authorization": f"Bearer {user_token}"}
    )
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_19_admin_update_order_status(client, admin_token):
    res = client.patch(
        "/api/v1/orders/1/status",
        json={"status": "SHIPPED"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "SHIPPED"


def test_20_customer_cannot_update_order_status(client, user_token):
    res = client.patch(
        "/api/v1/orders/1/status",
        json={"status": "DELIVERED"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert res.status_code == 403


# --- 5. WEBSOCKET REAL-TIME STREAM (1 Test) ---
def test_21_websocket_order_stream(client):
    with client.websocket_connect("/ws/orders/1") as ws:
        init_data = ws.receive_json()
        assert init_data["event"] == "CONNECTED"
        assert "Subscribed" in init_data["message"]
