import random
from locust import HttpUser, task, between

class EcommerceCustomerUser(HttpUser):
    """
    Day 19 Load Testing Suite:
    Simulates 50 concurrent realistic shopper behaviors on R-Mart e-commerce API.
    Tasks:
    1. Browsing default product catalog (Cache-Aside Redis hit)
    2. Real-time product search with keyword queries
    3. Category filtering
    4. Viewing individual product details
    5. GZip response compression verification
    6. System health & ping check
    """
    wait_time = between(0.05, 0.2)

    @task(4)
    def browse_catalog(self):
        """Simulates users browsing the main store feed"""
        with self.client.get("/api/v1/products", catch_response=True, name="1. Browse Products") as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Browse products returned HTTP {resp.status_code}")

    @task(3)
    def search_products(self):
        """Simulates users searching catalog with keywords"""
        keyword = random.choice(["phone", "milk", "laptop", "sound", "headset", "desk", "coffee"])
        with self.client.get(f"/api/v1/products?q={keyword}", catch_response=True, name="2. Search Query") as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Search failed with HTTP {resp.status_code}")

    @task(2)
    def filter_by_category(self):
        """Simulates users filtering by category"""
        cat = random.choice(["Electronics", "Groceries", "Furniture", "Books", "Clothing"])
        with self.client.get(f"/api/v1/products?category={cat}", catch_response=True, name="3. Category Filter") as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Category filter returned HTTP {resp.status_code}")

    @task(2)
    def view_single_product(self):
        """Simulates clicking on an item for detailed view"""
        prod_id = random.randint(1, 8)
        with self.client.get(f"/api/v1/products/{prod_id}", catch_response=True, name="4. Product Detail") as resp:
            # 200 or 404 (if not seeded) is acceptable HTTP response, 500 is failure
            if resp.status_code in [200, 404]:
                resp.success()
            else:
                resp.failure(f"Detail returned server error HTTP {resp.status_code}")

    @task(2)
    def test_compression_endpoint(self):
        """Simulates compressed API payload transfer"""
        headers = {"Accept-Encoding": "gzip, deflate"}
        with self.client.get("/api/v1/test-compression", headers=headers, catch_response=True, name="5. GZip Compression") as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Compression test returned HTTP {resp.status_code}")

    @task(1)
    def check_health(self):
        """Root API health check probe"""
        with self.client.get("/", catch_response=True, name="6. Root Health") as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"Health check failed HTTP {resp.status_code}")
