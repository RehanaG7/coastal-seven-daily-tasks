import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.database import engine, async_session_maker
from app.models.base import Base
from app.models.user import User
from app.models.product import Product
from sqlalchemy import select

async def init_db():
    print("Connecting to SQLite database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables verified/created successfully.")

    async with async_session_maker() as session:
        res = await session.execute(select(User).limit(1))
        user = res.scalar_one_or_none()
        if not user:
            print("Creating initial store admin user...")
            user = User(
                username="store_admin",
                email="admin@rmart.com",
                is_active=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            print(f"Created user ID: {user.id}")

        res_prod = await session.execute(select(Product).limit(1))
        has_prod = res_prod.scalar_one_or_none()
        if not has_prod:
            print("Seeding real catalog records into products table...")
            sample_products = [
                Product(
                    title="Apple iPhone 15 Pro Max 256GB Titanium",
                    description="Aerospace-grade titanium design with A17 Pro chip, 48MP main camera, and USB-C with USB 3 speeds.",
                    price=1199.99,
                    stock=14,
                    owner_id=user.id
                ),
                Product(
                    title="Samsung Galaxy S24 Ultra 5G AI Phone",
                    description="Built-in S Pen, Snapdragon 8 Gen 3 with Galaxy AI, 200MP camera, and titanium frame.",
                    price=1299.99,
                    stock=10,
                    owner_id=user.id
                ),
                Product(
                    title="27-Inch 165Hz QHD Curved Gaming Monitor",
                    description="Immersive 1500R curvature with 1ms GTG response time, HDR400, and AMD FreeSync Premium.",
                    price=299.99,
                    stock=8,
                    owner_id=user.id
                ),
                Product(
                    title="Sony WH-1000XM5 Wireless Headphones",
                    description="Industry-leading active noise canceling with two processors, 8 microphones, and 30-hour battery life.",
                    price=349.99,
                    stock=12,
                    owner_id=user.id
                ),
                Product(
                    title="Custom Mechanical RGB Gaming Keyboard",
                    description="Hot-swappable tactile switches with customizable per-key RGB backlighting and PBT keycaps.",
                    price=89.99,
                    stock=20,
                    owner_id=user.id
                )
            ]
            session.add_all(sample_products)
            await session.commit()
            print(f"Success: {len(sample_products)} products committed to database!")
        else:
            print("Database products table already contains active records.")

if __name__ == "__main__":
    asyncio.run(init_db())
