class Book:
    def __init__(self, title, author):
        self.title = title
        self.author = author
    def get_details(self):
        print(f"'{self.title}' by {self.author}")
if __name__ == "__main__":
    book1 = Book("Coding","Rehan") 
    book2 = Book("Life", "Rehan")
    book1.get_details()
    book2.get_details()