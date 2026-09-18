"""
Task: List Comprehensions & Lambda Functions
Demonstrates:
- Concise list generation with filtering
- Anonymous single-expression lambda functions
"""

numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
even_squares = [x ** 2 for x in numbers if x % 2 == 0]
calculate_percentage = lambda marks, total: round((marks / total) * 100, 2)

if __name__ == "__main__":
    print(f"Original list: {numbers}")
    print(f"Even squares: {even_squares}")
    print(f"Percentage: {calculate_percentage(42, 50)}%")