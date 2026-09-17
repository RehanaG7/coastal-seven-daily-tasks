"""
Day 1 - Core Python Fundamentals
Covers: Functions, Loops, Dictionaries, Lists, and Error Handling
"""

# 1. Calculator with Error Handling
def calculator(a: float, b: float, operator: str):
    if operator == "+":
        return a + b
    elif operator == "-":
        return a - b
    elif operator == "*":
        return a * b
    elif operator == "/":
        try:
            return a / b
        except ZeroDivisionError:
            return "Error: Cannot divide by zero"
    return "Invalid operator"

# 2. Even or Odd Checker
def is_even_or_odd(num: int) -> str:
    return "Even" if num % 2 == 0 else "Odd"

# 3. Largest of Three Numbers
def find_largest(a: int, b: int, c: int) -> int:
    return max(a, b, c)

# 4. List Operations
def manage_scores():
    scores = [85, 92, 78, 64, 95]
    scores.append(88)      # Add an element
    scores.remove(64)      # Remove an element
    scores.sort()          # Sort in ascending order
    return {
        "updated_scores": scores,
        "highest": scores[-1],
        "lowest": scores[0],
        "total": sum(scores)
    }

# 5. Dictionary Operations & Student Grade Evaluator
def evaluate_student_grades():
    students = {
        "Rehana": 94,
        "Aarav": 82,
        "Pooja": 67,
        "Vikram": 45
    }
    
    report = {}
    for student, mark in students.items():
        if mark >= 90:
            grade = "A"
        elif mark >= 75:
            grade = "B"
        elif mark >= 60:
            grade = "C"
        else:
            grade = "Pass"
        report[student] = {"marks": mark, "grade": grade}
        
    return report

if __name__ == "__main__":
    print("--- 1. Calculator Output ---")
    print("10 / 2 =", calculator(10, 2, "/"))
    print("10 / 0 =", calculator(10, 0, "/"))

    print("\n--- 2. Even / Odd Output ---")
    print("7 is:", is_even_or_odd(7))
    print("14 is:", is_even_or_odd(14))

    print("\n--- 3. Largest Number ---")
    print("Largest of (25, 89, 44):", find_largest(25, 89, 44))

    print("\n--- 4. List Operations ---")
    print(manage_scores())

    print("\n--- 5. Student Grade Report ---")
    print(evaluate_student_grades())