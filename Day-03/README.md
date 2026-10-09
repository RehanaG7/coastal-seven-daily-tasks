# Day 03 — Object-Oriented Programming (OOP) in Python

<p align="left">
  <img src="https://img.shields.io/badge/PYTHON-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/OOP-ENCAPSULATION-E0234E?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/OOP-INHERITANCE-10B981?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/OOP-POLYMORPHISM-6366F1?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/OOP-ABSTRACTION-F59E0B?style=for-the-badge&logo=python&logoColor=white" />
</p>

---

## 🎯 Overview & Objectives

Day 03 establishes complete command over Python's Object-Oriented Programming paradigm. The exercises systematically progress through the 4 core pillars of OOP (Encapsulation, Abstraction, Inheritance, Polymorphism) and the Python Data Model.

### 🌟 Key Exercises & Concepts:
1. **`01_class_and_object.py`**: Class instantiation, constructor anatomy (`__init__`), instance attributes, and method binding.
2. **`02_variables_and_dunder.py`**: Distinction between class-level variables (shared memory) vs instance variables, and class attribute namespaces.
3. **`03_dunder_methods.py`**: Deep dive into Python Magic / Dunder methods (`__str__`, `__repr__`, `__len__`, `__add__`, `__eq__`).
4. **`04_bank_account.py`**: Defensive programming & Encapsulation. Enforces private state (`__balance`), validation rules for deposits/withdrawals, and safe accessor methods.
5. **`05_inheritance.py`**: Single & multi-level inheritance trees, leveraging `super()` for base class initialization and Method Resolution Order (`MRO`).
6. **`06_polymorphism.py`**: Duck typing, dynamic dispatch, and unified interfaces across distinct concrete types.
7. **`07_abstract_class.py`**: Contract enforcement using the `abc` module (`ABC`, `@abstractmethod`), ensuring subclasses implement mandatory interfaces.
8. **`08_property.py`**: Pythonic property management using `@property`, `@<name>.setter`, and `@<name>.deleter` with validation logic.

---

## 📂 Directory Structure

```text
Day-03/
├── README.md                   # Module documentation & execution guide
├── 01_class_and_object.py      # Classes and object creation
├── 02_variables_and_dunder.py  # Class vs instance attributes
├── 03_dunder_methods.py        # Operator overloading & magic methods
├── 04_bank_account.py          # Encapsulation & private state
├── 05_inheritance.py           # Class inheritance and super()
├── 06_polymorphism.py          # Dynamic polymorphism & duck typing
├── 07_abstract_class.py        # Abstract base classes (ABC)
└── 08_property.py              # Property getters, setters, and deleters
```

---

## 🚀 How to Run & Verify

```bash
python 03_dunder_methods.py
python 04_bank_account.py
python 07_abstract_class.py
python 08_property.py
```
