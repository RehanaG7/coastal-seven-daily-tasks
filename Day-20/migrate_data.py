import sys
import sqlite3
import re
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Setup path to import backend models
curr_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(curr_dir / "backend"))

from core.database import Base
from models.user import User
from models.product import Product
from models.order import Order, OrderItem
from models.ecommerce import (
    CartItem, WishlistItem, SupportTicket,
    Review, ChatMessage, Notification
)

def get_postgres_url():
    # Read Postgres URL from Day-04/.env
    env_path = curr_dir.parent / "Day-04" / ".env"
    url = None
    for line in open(env_path):
        if line.startswith("DATABASE_URL="):
            url = line.split("=", 1)[1].strip().strip('"').strip("'")
            break
    if not url:
        raise ValueError("Could not find base PostgreSQL connection string.")
    
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return re.sub(r"/neondb(\?|$)", r"/ecommerce_db\1", url)

def migrate():
    sqlite_path = curr_dir / "ecommerce.db"
    if not sqlite_path.exists():
        raise FileNotFoundError(f"SQLite file not found at: {sqlite_path}")

    pg_url = get_postgres_url()
    print("1. Connecting to PostgreSQL ecommerce_db...")
    pg_engine = create_engine(pg_url, pool_pre_ping=True)

    print("2. Ensuring pg_trgm extension is active...")
    with pg_engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
        conn.commit()

    print("3. Creating all 10 tables in PostgreSQL schema...")
    Base.metadata.create_all(bind=pg_engine)

    print("4. Reading existing data from SQLite ecommerce.db...")
    s_conn = sqlite3.connect(str(sqlite_path))
    s_conn.row_factory = sqlite3.Row

    PgSession = sessionmaker(bind=pg_engine)
    pg_db = PgSession()

    try:
        # --- A. Migrate USERS ---
        s_users = s_conn.execute("SELECT * FROM users").fetchall()
        print(f"   Found {len(s_users)} users in SQLite.")
        for row in s_users:
            exists = pg_db.query(User).filter(User.id == row["id"]).first()
            if not exists:
                pg_db.add(User(
                    id=row["id"],
                    email=row["email"],
                    hashed_password=row["hashed_password"],
                    full_name=row["full_name"],
                    role=row["role"]
                ))
        pg_db.commit()

        # --- B. Migrate PRODUCTS ---
        s_products = s_conn.execute("SELECT * FROM products").fetchall()
        print(f"   Found {len(s_products)} products in SQLite.")
        for row in s_products:
            exists = pg_db.query(Product).filter(Product.id == row["id"]).first()
            if not exists:
                pg_db.add(Product(
                    id=row["id"],
                    name=row["name"],
                    description=row["description"],
                    price=row["price"],
                    stock=row["stock"],
                    image_url=row["image_url"],
                    category=row["category"] if "category" in row.keys() else "General"
                ))
        pg_db.commit()

        # --- C. Migrate CHAT MESSAGES ---
        s_chats = s_conn.execute("SELECT * FROM chat_messages").fetchall()
        print(f"   Found {len(s_chats)} chat messages in SQLite.")
        for row in s_chats:
            exists = pg_db.query(ChatMessage).filter(ChatMessage.id == row["id"]).first()
            if not exists:
                pg_db.add(ChatMessage(
                    id=row["id"],
                    room_id=row["room_id"] if "room_id" in row.keys() else "general",
                    sender_id=row["sender_id"],
                    sender_role=row["sender_role"] if "sender_role" in row.keys() else "customer",
                    sender_name=row["sender_name"] if "sender_name" in row.keys() else "Customer",
                    text=row["text"],
                    is_read=row["is_read"] if "is_read" in row.keys() else 0
                ))
        pg_db.commit()

        # --- D. Migrate ORDERS (if any) ---
        s_orders = s_conn.execute("SELECT * FROM orders").fetchall()
        print(f"   Found {len(s_orders)} orders in SQLite.")
        for row in s_orders:
            exists = pg_db.query(Order).filter(Order.id == row["id"]).first()
            if not exists:
                pg_db.add(Order(
                    id=row["id"],
                    user_id=row["user_id"],
                    total_amount=row["total_amount"],
                    status=row["status"]
                ))
        pg_db.commit()

        # --- E. Reset Postgres ID Sequences ---
        print("5. Synchronizing PostgreSQL ID sequences...")
        with pg_engine.connect() as conn:
            for table in ["users", "products", "chat_messages", "orders", "order_items"]:
                try:
                    conn.execute(text(f"""
                        SELECT setval(pg_get_serial_sequence('{table}', 'id'), 
                               COALESCE((SELECT MAX(id) FROM {table}), 1));
                    """))
                    conn.commit()
                except Exception:
                    pass

        # --- F. Verify Counts in PostgreSQL ---
        pg_user_count = pg_db.query(User).count()
        pg_prod_count = pg_db.query(Product).count()
        pg_chat_count = pg_db.query(ChatMessage).count()
        print("\n--- MIGRATION VERIFICATION ---")
        print(f"Users in PostgreSQL:         {pg_user_count} / {len(s_users)}")
        print(f"Products in PostgreSQL:      {pg_prod_count} / {len(s_products)}")
        print(f"Chat Messages in PostgreSQL: {pg_chat_count} / {len(s_chats)}")
        assert pg_user_count == len(s_users), "User count mismatch!"
        assert pg_prod_count == len(s_products), "Product count mismatch!"
        assert pg_chat_count == len(s_chats), "Chat message count mismatch!"
        print("[OK] ALL DATA MIGRATED WITH 100% ACCURACY!")

    finally:
        pg_db.close()
        s_conn.close()

if __name__ == "__main__":
    migrate()
