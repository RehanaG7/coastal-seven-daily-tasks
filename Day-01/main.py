"""
Day 1 - FastAPI Student Management REST API
Full CRUD implementation with Pydantic schemas and interactive Swagger UI.
"""

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

app = FastAPI(
    title="Student Management API",
    description="Coastal Seven Day-01 REST API deliverable.",
    version="1.0.0"
)

# 1. Pydantic Schemas for Validation
class StudentCreate(BaseModel):
    name: str = Field(..., examples=["Shaik Rehana"])
    age: int = Field(..., ge=18, le=60, examples=[22])
    grade: str = Field(..., examples=["A"])
    course: str = Field(..., examples=["AI & Data Science"])

class StudentUpdate(BaseModel):
    name: str | None = None
    age: int | None = None
    grade: str | None = None
    course: str | None = None

class StudentResponse(BaseModel):
    id: int
    name: str
    age: int
    grade: str
    course: str

# 2. In-Memory Mock Database
students_db = {
    1: {"id": 1, "name": "Shaik Rehana", "age": 22, "grade": "A", "course": "AI & Data Science"},
    2: {"id": 2, "name": "Aarav Sharma", "age": 23, "grade": "B", "course": "Cloud Architecture"}
}

# 3. GET: Fetch all students (with optional query filter)
@app.get("/students", response_model=list[StudentResponse], tags=["Students"])
def get_all_students(course: str | None = None):
    """Retrieve all student records, with optional filtering by course."""
    if course:
        return [s for s in students_db.values() if s["course"].lower() == course.lower()]
    return list(students_db.values())

# 4. GET: Fetch single student by ID (Path Parameter)
@app.get("/students/{student_id}", response_model=StudentResponse, tags=["Students"])
def get_student_by_id(student_id: int):
    """Retrieve a single student record using their unique ID."""
    if student_id not in students_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found."
        )
    return students_db[student_id]

# 5. POST: Create new student
@app.post("/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED, tags=["Students"])
def create_student(student: StudentCreate):
    """Create a new student entry with automated Pydantic schema validation."""
    new_id = max(students_db.keys(), default=0) + 1
    new_record = {"id": new_id, **student.model_dump()}
    students_db[new_id] = new_record
    return new_record

# 6. PUT: Update an existing student
@app.put("/students/{student_id}", response_model=StudentResponse, tags=["Students"])
def update_student(student_id: int, payload: StudentUpdate):
    """Update fields of an existing student using their ID."""
    if student_id not in students_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found."
        )
    
    update_data = payload.model_dump(exclude_unset=True)
    students_db[student_id].update(update_data)
    return students_db[student_id]

# 7. DELETE: Remove a student
@app.delete("/students/{student_id}", status_code=status.HTTP_200_OK, tags=["Students"])
def delete_student(student_id: int):
    """Delete a student record from the system."""
    if student_id not in students_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found."
        )
    deleted_entry = students_db.pop(student_id)
    return {"message": f"Student '{deleted_entry['name']}' with ID {student_id} successfully deleted."}