from abc import ABC, abstractmethod


class Shape(ABC):
    @abstractmethod
    def area(self):
        pass


class Square(Shape):
    def __init__(self, side):
        self.side = side

    def area(self):
        return self.side * self.side


if __name__ == "__main__":
    sq = Square(4)
    print(f"Square Area: {sq.area()}")
