class Person:
    def __init__(self, name):
        self.name = name


class Student(Person):
    def __init__(self, name, roll_no):
        super().__init__(name)
        self.roll_no = roll_no

    def display(self):
        print(f"Name: {self.name}, Roll No: {self.roll_no}")


if __name__ == "__main__":
    s = Student("Rehana", 101)
    s.display()
