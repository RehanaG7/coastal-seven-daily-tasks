"""
Task: Functions, Variable Arguments (*args, **kwargs), and LEGB Scope
Demonstrates:
- Positional variable arguments packed into a Tuple (*args)
- Keyword variable arguments packed into a Dictionary (**kwargs)
- Python's LEGB resolution order
"""

def student_report(name, *marks, **details):
    total = sum(marks)
    average = round(total / len(marks), 2) if marks else 0.0
    print(f"Student: {name}")
    print(f"Marks (Tuple): {marks} | Total: {total} | Avg: {average}")
    print(f"Additional Info (Dict): {details}")

scope_level = "Global"

def outer_function():
    scope_level = "Enclosing"
    def inner_function():
        scope_level = "Local"
        print(f"Inner function accesses: {scope_level}")
    inner_function()
    print(f"Outer function accesses: {scope_level}")

if __name__ == "__main__":
    student_report("Rehana", 85, 90, 95, track="Python", batch=2026)
    outer_function()
    print(f"Module level accesses: {scope_level}")