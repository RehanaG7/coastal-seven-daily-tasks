from db import init_db
from models import Task
from task_manager import TaskManager

def print_menu():
    print("\n==============================")
    print("      CLI TASK MANAGER        ")
    print("==============================")
    print("1. View All Tasks")
    print("2. Add New Task")
    print("3. Update Task Status")
    print("4. Delete a Task")
    print("5. Manage Categories")
    print("6. View Task Summary (GROUP BY)")
    print("7. Export Tasks to JSON")
    print("8. View Busy Categories (GROUP BY / HAVING)")
    print("0. Exit")
    print("------------------------------")

def view_tasks(manager: TaskManager):
    tasks = manager.get_all_tasks()
    if not tasks:
        print("\nNo tasks found.")
        return

    print("\nID  | Title                | Status       | Priority | Due Date   | Category")
    print("-" * 75)
    for t_id, title, status, priority, due_date, cat_name in tasks:
        due = str(due_date) if due_date else "N/A"
        cat = cat_name if cat_name else "Unassigned"
        print(f"{t_id:<3} | {title:<20} | {status:<12} | {priority:<8} | {due:<10} | {cat}")

def add_task_cli(manager: TaskManager):
    title = input("\nTask title: ").strip()
    if not title:
        print("Title cannot be empty.")
        return

    description = input("Description (optional): ").strip()
    priority = input("Priority (Low / Medium / High) [Medium]: ").strip().capitalize() or "Medium"
    if priority not in Task.VALID_PRIORITIES:
        priority = "Medium"

    due_date = input("Due Date (YYYY-MM-DD, optional): ").strip() or None

    categories = manager.list_categories()
    category_id = None
    if categories:
        print("\nAvailable Categories:")
        for cid, name in categories:
            print(f"  [{cid}] {name}")
        cat_in = input("Select Category ID (leave blank to skip): ").strip()
        if cat_in.isdigit():
            category_id = int(cat_in)

    new_task = Task(
        title=title,
        description=description,
        priority=priority,
        due_date=due_date,
        category_id=category_id
    )
    new_id = manager.add_task(new_task)
    print(f"\n[SUCCESS] Task #{new_id} added successfully.")

def update_status_cli(manager: TaskManager):
    task_id = input("\nEnter Task ID to update: ").strip()
    if not task_id.isdigit():
        print("Invalid ID.")
        return

    print("1. Pending | 2. In Progress | 3. Completed")
    choice = input("Select new status: ").strip()
    status_map = {"1": "Pending", "2": "In Progress", "3": "Completed"}
    status = status_map.get(choice)

    if not status:
        print("Invalid status choice.")
        return

    if manager.update_task_status(int(task_id), status):
        print(f"\n[SUCCESS] Task #{task_id} updated to {status}.")
    else:
        print(f"\n[ERROR] Task #{task_id} not found.")

def main():
    init_db()
    manager = TaskManager()

    while True:
        print_menu()
        choice = input("Enter option: ").strip()

        if choice == "1":
            view_tasks(manager)
        elif choice == "2":
            add_task_cli(manager)
        elif choice == "3":
            update_status_cli(manager)
        elif choice == "4":
            tid = input("\nEnter Task ID to delete: ").strip()
            if tid.isdigit() and manager.delete_task(int(tid)):
                print(f"\n[SUCCESS] Task #{tid} deleted.")
            else:
                print("\n[ERROR] Task not found or invalid ID.")
        elif choice == "5":
            cat_name = input("\nEnter new category name: ").strip()
            if cat_name:
                cid = manager.add_category(cat_name)
                print(f"[SUCCESS] Category '{cat_name}' ready with ID {cid}.")
        elif choice == "6":
            report = manager.get_summary_report()
            print("\n--- Task Counts by Status ---")
            for status, count in report:
                print(f"  {status}: {count}")
        elif choice == "7":
            filepath = manager.export_tasks_to_json()
            print(f"\n[SUCCESS] Tasks exported to {filepath}")
        elif choice == "8":
            min_count = input("Enter minimum task threshold [default 1]: ").strip()
            threshold = int(min_count) if min_count.isdigit() else 1
            results = manager.get_busy_categories(threshold)
            print(f"\n--- Categories with >= {threshold} Tasks ---")
            if not results:
                print("  None found.")
            for cname, cnt in results:
                print(f"  {cname}: {cnt} tasks")
        elif choice == "0":
            print("\nExiting CLI Task Manager. Goodbye!")
            break
        else:
            print("\nInvalid choice. Try again.")

if __name__ == "__main__":
    main()