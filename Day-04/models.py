from datetime import datetime

class Category:
    def __init__(self, id=None, name=""):
        self.id = id
        self.name = name

    def __repr__(self):
        return f"<Category id={self.id} name='{self.name}'>"


class Task:
    VALID_STATUSES = ("Pending", "In Progress", "Completed")
    VALID_PRIORITIES = ("Low", "Medium", "High")

    def __init__(self, title, description="", status="Pending", priority="Medium", due_date=None, category_id=None, id=None, created_at=None):
        if status not in self.VALID_STATUSES:
            raise ValueError(f"Invalid status '{status}'. Must be one of {self.VALID_STATUSES}")
        if priority not in self.VALID_PRIORITIES:
            raise ValueError(f"Invalid priority '{priority}'. Must be one of {self.VALID_PRIORITIES}")

        self.id = id
        self.title = title
        self.description = description
        self.status = status
        self.priority = priority
        self.due_date = due_date
        self.category_id = category_id
        self.created_at = created_at or datetime.now()

    def mark_completed(self):
        self.status = "Completed"

    def __repr__(self):
        return f"<Task id={self.id} title='{self.title}' status='{self.status}'>"