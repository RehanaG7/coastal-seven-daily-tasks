import psycopg2
from config import DB_URL, logger

def get_connection():
    """Establish and return a connection to PostgreSQL using psycopg2."""
    return psycopg2.connect(DB_URL)

def init_db():
    """Create relational tables and indexes if they do not exist."""
    schema_sql = """
    CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
        priority VARCHAR(10) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
        due_date DATE,
        category_id INT REFERENCES categories(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(schema_sql)
            conn.commit()
        logger.info("[DB] Tables initialized successfully via psycopg2.")
    except Exception as err:
        logger.error("[DB] Table initialization failed: %s", err)
        raise

if __name__ == "__main__":
    init_db()