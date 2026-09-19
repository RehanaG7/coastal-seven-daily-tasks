def run_fizzbuzz(limit: int = 15):
    for num in range(1, limit + 1):
        if num % 3 == 0 and num % 5 == 0:
            print(f"{num}: FizzBuzz")
        elif num % 3 == 0:
            print(f"{num}: Fizz")
        elif num % 5 == 0:
            print(f"{num}: Buzz")
        else:
            print(f"{num}")

if __name__ == "__main__":
    run_fizzbuzz(15)