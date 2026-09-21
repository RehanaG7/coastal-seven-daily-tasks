from models import Task
from task_manager import TaskManager

def seed_data():
    manager = TaskManager()
    print("Seeding sample data...")

    # 1. Categories
    cat_eng = manager.add_category("Engineering")
    cat_acad = manager.add_category("Academics")
    cat_pers = manager.add_category("Personal")

    # 2. Tasks with diverse statuses and priorities
    sample_tasks = [
        Task("Implement database indexing", "Optimize tasks table queries", "Completed", "High", "2026-09-20", cat_eng),
        Task("Prepare unit test suite", "Write unittest cases for CRUD", "Completed", "Medium", "2026-09-21", cat_eng),
        Task("Configure Neon PostgreSQL", "Set up cloud connection pool", "Completed", "High", "2026-09-19", cat_eng),
        Task("Study B-Tree Indexes", "Review relational indexing mechanics", "In Progress", "High", "2026-09-23", cat_acad),
        Task("Submit Day 4 Assessment", "Complete GitHub PR and peer review", "Pending", "High", "2026-09-21", cat_acad),
        Task("Clean workspace", "Weekly room and desk cleanup", "Pending", "Low", "2026-09-22", cat_pers),
    ]

    for t in sample_tasks:
        manager.add_task(t)

    print("\n[SUCCESS] Database seeded successfully!")

if __name__ == "__main__":
    seed_data()