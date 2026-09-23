import json
import logging
from db import get_connection
from models import Task

logger = logging.getLogger("TaskManagerApp")

class TaskManager:
    def add_category(self, name: str) -> int:
        query = """
        INSERT INTO categories (name) 
        VALUES (%s) 
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
        RETURNING id;
        """
        try:
            with get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (name.strip(),))
                    category_id = cur.fetchone()[0]
                conn.commit()
            logger.info("Category '%s' saved with ID %s", name, category_id)
            return category_id
        except Exception as err:
            logger.error("Error adding category '%s': %s", name, err)
            raise

    def list_categories(self):
        query = "SELECT id, name FROM categories ORDER BY id ASC;"
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query)
                return cur.fetchall()

    def add_task(self, task: Task) -> int:
        query = """
        INSERT INTO tasks (title, description, status, priority, due_date, category_id)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id;
        """
        try:
            with get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (
                        task.title,
                        task.description,
                        task.status,
                        task.priority,
                        task.due_date,
                        task.category_id
                    ))
                    task_id = cur.fetchone()[0]
                conn.commit()
            logger.info("Task created successfully with ID %s", task_id)
            return task_id
        except Exception as err:
            logger.error("Error adding task: %s", err)
            raise

    def get_all_tasks(self, status_filter=None):
        base_query = """
        SELECT t.id, t.title, t.status, t.priority, t.due_date, c.name
        FROM tasks t
        LEFT JOIN categories c ON t.category_id = c.id
        """
        params = ()
        if status_filter:
            base_query += " WHERE t.status = %s"
            params = (status_filter,)

        base_query += " ORDER BY t.id ASC;"

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(base_query, params)
                return cur.fetchall()

    def update_task_status(self, task_id: int, new_status: str) -> bool:
        query = "UPDATE tasks SET status = %s WHERE id = %s RETURNING id;"
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (new_status, task_id))
                updated = cur.fetchone()
            conn.commit()
        return updated is not None

    def delete_task(self, task_id: int) -> bool:
        query = "DELETE FROM tasks WHERE id = %s RETURNING id;"
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (task_id,))
                deleted = cur.fetchone()
            conn.commit()
        return deleted is not None

    def get_summary_report(self):
        """Aggregate query using GROUP BY."""
        query = "SELECT status, COUNT(*) FROM tasks GROUP BY status;"
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query)
                return cur.fetchall()

    def get_busy_categories(self, min_tasks: int = 1):
        """Aggregate query with JOIN, GROUP BY, and HAVING."""
        query = """
        SELECT c.name, COUNT(t.id) AS task_count
        FROM categories c
        JOIN tasks t ON c.id = t.category_id
        GROUP BY c.name
        HAVING COUNT(t.id) >= %s
        ORDER BY task_count DESC;
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (min_tasks,))
                return cur.fetchall()

    def export_tasks_to_json(self, output_filepath: str = "tasks_export.json") -> str:
        """Structured JSON export requirement."""
        query = """
        SELECT t.id, t.title, t.description, t.status, t.priority, 
               t.due_date, c.name AS category_name, t.created_at
        FROM tasks t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.id ASC;
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query)
                rows = cur.fetchall()

        data = [
            {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "status": row[3],
                "priority": row[4],
                "due_date": str(row[5]) if row[5] else None,
                "category": row[6] or "Unassigned",
                "created_at": str(row[7]) if row[7] else None
            }
            for row in rows
        ]

        with open(output_filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

        return output_filepath