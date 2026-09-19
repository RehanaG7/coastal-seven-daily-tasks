def demonstrate_structures():
    tech_stack = ["Python", "FastAPI"]
    tech_stack.append("Docker")
    tech_stack.sort()
    print(f"Sorted List: {tech_stack}")

    server_config = ("127.0.0.1", 8000)
    print(f"Server Host: {server_config[0]}, Port: {server_config[1]}")

    skills_a = {"Python", "Git", "FastAPI"}
    skills_b = {"FastAPI", "Docker", "AWS"}
    print(f"Common skills (Intersection): {skills_a & skills_b}")
    print(f"All combined skills (Union): {skills_a | skills_b}")
    print(f"Unique to A (Difference): {skills_a - skills_b}")

    user_record = {"id": 101, "name": "Rehana"}
    email = user_record.get("email", "Not Provided")
    print(f"Dictionary access with default (.get): {email}")

if __name__ == "__main__":
    demonstrate_structures()