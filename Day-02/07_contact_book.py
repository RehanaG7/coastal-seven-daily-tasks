"""
Task: Contact Book with JSON Persistence and CSV Export
Demonstrates:
- File handling (read/write)
- JSON serialization/deserialization
- CSV export using csv.writer
- Exception handling (try/except)
"""

import json
import csv
import os

DB_FILE = "contacts.json"
EXPORT_FILE = "contacts_export.csv"

class ContactBook:
    def __init__(self, filename=DB_FILE):
        self.filename = filename
        self.contacts = self.load_contacts()

    def load_contacts(self) -> dict:
        if not os.path.exists(self.filename):
            return {}
        try:
            with open(self.filename, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}

    def save_contacts(self):
        with open(self.filename, "w") as f:
            json.dump(self.contacts, f, indent=4)

    def add_contact(self, name: str, phone: str, email: str):
        self.contacts[name] = {"phone": phone, "email": email}
        self.save_contacts()
        print(f"[Added] {name}")

    def get_contact(self, name: str):
        return self.contacts.get(name, "Contact not found.")

    def export_to_csv(self, output_file=EXPORT_FILE):
        with open(output_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["Name", "Phone", "Email"])
            for name, info in self.contacts.items():
                writer.writerow([name, info["phone"], info["email"]])
        print(f"[Exported] Contacts saved to {output_file}")

if __name__ == "__main__":
    book = ContactBook()
    book.add_contact("Rehana", "9876543210", "rehana@example.com")
    book.add_contact("Alex", "9123456789", "alex@example.com")
    
    print(f"\nFetched Record: {book.get_contact('Rehana')}")
    book.export_to_csv()