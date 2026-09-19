class Book:
    def __init__(self, title, pages):
        self.title = title
        self.pages = pages
    def __str__(self):
        return f"{self.title} ({self.pages} pages)"
    def __len__(self):
        return self.pages


if __name__ == "__main__":
    b = Book("Python Basics", 200)

    print(b)          
    print(len(b))     