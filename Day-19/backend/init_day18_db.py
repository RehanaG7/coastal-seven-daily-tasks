import sys
from pathlib import Path

# Add backend directory to path
_backend_dir = Path(__file__).resolve().parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

from core.database import engine, Base
from sqlalchemy import text
from models.user import User
from models.product import Product
from models.order import Order, OrderItem
from models.ecommerce import ChatMessage, Notification


def init_day18_database():
    """
    Ensure PostgreSQL tables, TSVECTOR search column, GIN indexes,
    and automatic update triggers are prepared.
    """
    print(f"Connecting to database: {engine.url.render_as_string(hide_password=True)}")
    
    # 1. Create all declarative tables
    Base.metadata.create_all(bind=engine)

    # 2. If PostgreSQL, configure pg_trgm, tsvector, and GIN indexes
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn:
            print("Enabling pg_trgm extension if not already enabled...")
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))

            print("Adding search_vector column to products if not exists...")
            conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;"))

            print("Populating initial search_vector across catalog...")
            conn.execute(text("""
                UPDATE products 
                SET search_vector = to_tsvector(
                    'english',
                    coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, '')
                );
            """))

            print("Ensuring GIN full-text search index (idx_products_search_vector)...")
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING gin(search_vector);"))

            print("Ensuring GIN trigram index (idx_products_name_trgm)...")
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);"))

            print("Configuring PostgreSQL trigger for automatic search_vector synchronization on INSERT/UPDATE...")
            conn.execute(text("""
                CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
                BEGIN
                  new.search_vector := to_tsvector(
                      'english',
                      coalesce(new.name, '') || ' ' || coalesce(new.description, '') || ' ' || coalesce(new.category, '')
                  );
                  return new;
                END
                $$ LANGUAGE plpgsql;
            """))
            conn.execute(text("DROP TRIGGER IF EXISTS tsvectorupdate ON products;"))
            conn.execute(text("""
                CREATE TRIGGER tsvectorupdate 
                BEFORE INSERT OR UPDATE ON products 
                FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();
            """))

        print("PostgreSQL Day 18 Full-Text & Fuzzy Trigram optimizations successfully configured!")
    else:
        print("Non-PostgreSQL dialect detected. Declarative tables created.")


if __name__ == "__main__":
    init_day18_database()
