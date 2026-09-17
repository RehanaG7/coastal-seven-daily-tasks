# Coastal Seven Daily Tasks

A centralized repository documenting daily engineering tasks, implementation modules, and hands-on deliverables.

---

## Repository Structure

```text
coastal-seven-daily-tasks/
├── Day-01/
│   ├── python_basics.py   # Core Python fundamentals, data structures & OOP
│   └── main.py            # FastAPI CRUD API with Pydantic validation
├── .gitignore             # Standard Python ignore rules
└── README.md              # Project documentation
```

---

## Day-01: Python Fundamentals & FastAPI CRUD API

### Overview
* `python_basics.py`: Covers variables, control flow, functions, OOP, and data structures.
* `main.py`: RESTful Student CRUD API built with FastAPI and validated using Pydantic.

### API Endpoints

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/students` | Retrieve all student records | `200 OK` |
| `GET` | `/students/{student_id}` | Retrieve a student by ID | `200 OK` / `404 Not Found` |
| `POST` | `/students` | Create a new student record | `201 Created` |
| `PUT` | `/students/{student_id}` | Update an existing student | `200 OK` / `404 Not Found` |
| `DELETE` | `/students/{student_id}` | Remove a student record | `200 OK` / `404 Not Found` |

### How to Run Locally

1. **Install dependencies:**
   ```bash
   pip install fastapi uvicorn pydantic
   ```

2. **Start the API server:**
   ```bash
   cd Day-01
   python -m uvicorn main:app --reload
   ```

3. **Access Interactive Docs:**
   * Swagger UI: http://127.0.0.1:8000/docs
   * ReDoc: http://127.0.0.1:8000/redoc
