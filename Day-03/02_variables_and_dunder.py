class Student:
    school_name = "NRIIT"
    total_students = 0
    def __init__(self, name, grade):
        self.name = name 
        self.grade = grade
        Student.total_students += 1
    def __str__(self):
        return f"Student{self.name} | Grade: {self.grade} | School: {Student.school_name}"
if __name__ == "__main__":
    s1 = Student("Ayesha", "A")
    s2 = Student("Kiran", "B")
    # 1. Test Dunder method __str__
    print(s1)
    print(s2)
    # 2. Test Class Variable counter
    print(f"Total enrolled students: {Student.total_students}")
    Student.school_name = "Apex Global Institute"
    print("\nAfter updating class variable school_name:")
    print(s1)
    print(s2)