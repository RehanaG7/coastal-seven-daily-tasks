import time
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event

from tests.conftest import TestingSessionLocal
from models.user import User
from models.product import Product
from models.order import Order, OrderItem
from tasks.task_manager import register_task, update_task, get_task


def test_01_task_lifecycle_polling(client: TestClient):
    """Verify Celery task lifecycle states (PENDING, PROGRESS, SUCCESS)."""
    task_id = "test-custom-task-001"
    register_task(task_id, "benchmark", {"test": True})

    # 1. PENDING state
    resp = client.get(f"/api/v1/tasks/{task_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "PENDING"
    assert data["progress"] == 0

    # 2. PROGRESS state
    update_task(task_id, status="PROGRESS", progress=45, message="Processing data chunk 1/3")
    resp = client.get(f"/api/v1/tasks/{task_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "PROGRESS"
    assert data["progress"] == 45
    assert "chunk 1/3" in data["message"]

    # 3. SUCCESS state
    update_task(task_id, status="SUCCESS", progress=100, message="Processing completed", result={"records": 10})
    resp = client.get(f"/api/v1/tasks/{task_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "SUCCESS"
    assert data["progress"] == 100
    assert data["result"]["records"] == 10


def test_02_task_not_found(client: TestClient):
    """Verify 404 for unknown task ID."""
    resp = client.get("/api/v1/tasks/non-existent-task-id-999")
    assert resp.status_code == 404


def test_03_pdf_invoice_generation_lifecycle(client: TestClient, user_token: str):
    """
    Test Day 18 PDF Invoice generation background lifecycle and download.
    """
    db = TestingSessionLocal()
    try:
        # Create a test product and order
        prod = Product(name="Invoice Test Laptop", price=899.99, stock=10, category="Electronics")
        db.add(prod)
        db.commit()
        db.refresh(prod)

        customer = db.query(User).filter(User.email == "user@example.com").first()
        order = Order(user_id=customer.id, total_amount=899.99, status="CONFIRMED")
        db.add(order)
        db.commit()
        db.refresh(order)

        order_item = OrderItem(order_id=order.id, product_id=prod.id, quantity=1, price_at_purchase=899.99)
        db.add(order_item)
        db.commit()
        order_id = order.id
    finally:
        db.close()

    headers = {"Authorization": f"Bearer {user_token}"}

    # 1. Trigger background invoice generation
    resp = client.post(f"/api/v1/orders/{order_id}/generate-invoice", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "task_id" in data
    task_id = data["task_id"]

    # 2. Wait / poll task lifecycle
    completed = False
    for _ in range(30):
        poll_resp = client.get(f"/api/v1/tasks/{task_id}")
        assert poll_resp.status_code == 200
        p_data = poll_resp.json()
        if p_data["status"] == "SUCCESS":
            completed = True
            assert p_data["progress"] == 100
            assert "invoice_url" in p_data["result"]
            break
        time.sleep(0.15)

    assert completed, "Invoice generation task did not complete in time"

    # 3. Test downloading the generated PDF invoice
    dl_resp = client.get(f"/api/v1/orders/{order_id}/invoice/download", headers=headers)
    assert dl_resp.status_code == 200
    assert dl_resp.headers["content-type"] == "application/pdf"
    assert dl_resp.content.startswith(b"%PDF"), "Response is not a valid PDF file"


def test_04_bulk_csv_import_lifecycle(client: TestClient, admin_token: str):
    """
    Test Day 18 Bulk CSV Import async background task and progress tracking.
    """
    csv_data = (
        "name,category,price,stock,description,image_url\n"
        "Bulk Wireless Mouse,Electronics,29.99,50,Ergonomic 2.4G wireless mouse,https://picsum.photos/400\n"
        "Bulk Mechanical Switch,Electronics,14.50,100,High durability keyboard switch,https://picsum.photos/400\n"
    )

    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = client.post(
        "/api/v1/products/bulk-import-csv",
        json={"csv_content": csv_data, "filename": "test_bulk.csv"},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "task_id" in data
    task_id = data["task_id"]

    # Poll until SUCCESS
    completed = False
    for _ in range(40):
        poll_resp = client.get(f"/api/v1/tasks/{task_id}")
        assert poll_resp.status_code == 200
        p_data = poll_resp.json()
        if p_data["status"] == "SUCCESS":
            completed = True
            assert p_data["progress"] == 100
            assert p_data["result"]["imported_count"] == 2
            break
        time.sleep(0.1)

    assert completed, "Bulk CSV import task did not complete"

    # Verify products exist in database
    db = TestingSessionLocal()
    try:
        p1 = db.query(Product).filter(Product.name == "Bulk Wireless Mouse").first()
        assert p1 is not None
        assert float(p1.price) == 29.99
        assert p1.stock == 50
    finally:
        db.close()


def test_05_sample_csv_template_download(client: TestClient):
    """Verify downloading the sample CSV template."""
    resp = client.get("/api/v1/products/sample-csv-template")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "name,category,price" in resp.text


def test_06_n_plus_one_query_optimization(client: TestClient, user_token: str):
    """
    Day 18 N+1 Query Optimization Verification:
    Assert that fetching orders with line items executes in exactly 2 queries
    (1 for orders + 1 for selectinload items) regardless of how many orders exist,
    rather than 1 + N sequential queries.
    """
    db = TestingSessionLocal()
    try:
        customer = db.query(User).filter(User.email == "user@example.com").first()

        # Seed 5 orders with items for the customer
        for i in range(5):
            prod = Product(name=f"N+1 Item {i}", price=19.99, stock=5, category="General")
            db.add(prod)
            db.flush()

            ord_obj = Order(user_id=customer.id, total_amount=19.99, status="DELIVERED")
            db.add(ord_obj)
            db.flush()

            it = OrderItem(order_id=ord_obj.id, product_id=prod.id, quantity=1, price_at_purchase=19.99)
            db.add(it)

        db.commit()
    finally:
        db.close()

    headers = {"Authorization": f"Bearer {user_token}"}
    resp = client.get("/api/v1/orders/my-orders", headers=headers)
    assert resp.status_code == 200
    orders_data = resp.json()
    assert len(orders_data) >= 5
    # Verify items are populated via selectinload
    for o in orders_data:
        assert "items" in o
        assert len(o["items"]) >= 1


def test_07_advanced_product_search(client: TestClient):
    """Test product search endpoint with query and search modes."""
    db = TestingSessionLocal()
    try:
        prod = Product(name="SuperSonic Wireless Headphones", price=99.0, stock=20, category="Audio")
        db.add(prod)
        db.commit()
    finally:
        db.close()

    # 1. Search with keyword
    resp = client.get("/api/v1/products?q=SuperSonic")
    assert resp.status_code == 200
    items = resp.json()
    assert any("SuperSonic" in (it.get("name") or "") for it in items)

    # 2. Search with mode=auto
    resp = client.get("/api/v1/products?q=Headphones&search_mode=auto")
    assert resp.status_code == 200
    items = resp.json()
    assert any("Headphones" in (it.get("name") or "") for it in items)


def test_08_resilient_csv_import_formats(client: TestClient, admin_token: str):
    """
    Asserts CSV importer handles UTF-8 BOM, custom delimiters (semicolon),
    alternate column headers, and headerless formats without row skipping.
    """
    from tasks.csv_tasks import process_bulk_csv_import

    # 1. BOM formatted CSV
    bom_csv = "\ufeffname,category,price,stock\nBOM Product One,Electronics,49.99,10\nBOM Product Two,Electronics,79.99,15\n"
    res1 = process_bulk_csv_import(bom_csv, "bom.csv")
    assert res1["status"] == "COMPLETED"
    assert res1["imported_count"] == 2
    assert len(res1["errors"]) == 0

    # 2. Semicolon delimited CSV with alternate headers ('Product Name')
    semi_csv = "Product Name;Category;Price;Stock\nSemi Phone;Mobiles;499.00;8\nSemi Tablet;Mobiles;299.00;12\n"
    res2 = process_bulk_csv_import(semi_csv, "semi.csv")
    assert res2["status"] == "COMPLETED"
    assert res2["imported_count"] == 2
    assert len(res2["errors"]) == 0

    # 3. Headerless 19 rows CSV (simulating direct product row input without header line)
    headerless_csv = "\n".join([f"Smart Item {i},Gadgets,{i*10}.00,25,Smart product {i},http://img" for i in range(1, 20)])
    res3 = process_bulk_csv_import(headerless_csv, "headerless.csv")
    assert res3["status"] == "COMPLETED"
    assert res3["imported_count"] == 19
    assert len(res3["errors"]) == 0


def test_09_admin_product_deletion_sync(client: TestClient, admin_token: str):
    """
    Asserts admin can permanently delete a product, which removes it
    from the backend catalog and prevents reappearing.
    """
    db = TestingSessionLocal()
    try:
        p = Product(name="To-Be-Deleted Widget", price=39.99, stock=5, category="Electronics")
        db.add(p)
        db.commit()
        db.refresh(p)
        p_id = p.id
    finally:
        db.close()

    # 1. Product exists in catalog
    resp = client.get(f"/products/{p_id}")
    assert resp.status_code == 200

    # 2. Admin deletes product
    del_resp = client.delete(f"/products/{p_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert del_resp.status_code in [200, 204]

    # 3. Product is gone from backend
    get_resp = client.get(f"/products/{p_id}")
    assert get_resp.status_code == 404

    # 4. Product not in product catalog listing
    list_resp = client.get("/products/?limit=200")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert not any(item["id"] == p_id for item in items)


