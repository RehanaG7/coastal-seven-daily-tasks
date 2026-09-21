import unittest
from models import Task
from task_manager import TaskManager

class TestTaskManager(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manager = TaskManager()

    def test_task_model_validation(self):
        """Test OOP Model validations."""
        with self.assertRaises(ValueError):
            Task(title="Invalid Status Task", status="NotAValidStatus")

        with self.assertRaises(ValueError):
            Task(title="Invalid Priority Task", priority="Urgent")

    def test_category_and_task_lifecycle(self):
        """Test full database CRUD cycle."""
        # 1. Create Category
        cat_id = self.manager.add_category("TestingCategory")
        self.assertIsInstance(cat_id, int)

        # 2. Create Task
        task = Task(
            title="Unit Test Task",
            description="Testing automated suite",
            priority="Low",
            category_id=cat_id
        )
        task_id = self.manager.add_task(task)
        self.assertIsInstance(task_id, int)

        # 3. Update Status
        updated = self.manager.update_task_status(task_id, "Completed")
        self.assertTrue(updated)

        # 4. Read & Verify
        tasks = self.manager.get_all_tasks()
        task_ids = [t[0] for t in tasks]
        self.assertIn(task_id, task_ids)

        # 5. Delete Task
        deleted = self.manager.delete_task(task_id)
        self.assertTrue(deleted)

if __name__ == "__main__":
    unittest.main()