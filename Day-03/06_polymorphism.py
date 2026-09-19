class Animal:
    def make_sound(self):
        return "Some generic animal sound"


class Dog(Animal):
    def make_sound(self):
        return "Bark!"


class Cat(Animal):
    def make_sound(self):
        return "Meow!"


if __name__ == "__main__":
    animals = [Dog(), Cat(), Animal()]
    for a in animals:
        print(a.make_sound())
