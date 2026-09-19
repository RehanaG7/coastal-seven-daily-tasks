class Student:
    def __init__(self, age):
        self._age = age

    @property
    def age(self):
        return self._age

    @age.setter
    def age(self, new_age):
        if new_age > 0:
            self._age = new_age
        else:
            print("Invalid: Age cannot be negative or zero!")


if __name__ == "__main__":
    s = Student(20)
    print(s.age)
    s.age = 22
    print(s.age)
