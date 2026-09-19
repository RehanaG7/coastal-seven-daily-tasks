def is_prime(n: int) -> bool:
    if n <= 1:
        return False
    # Optimization: check divisors up to square root of n
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

if __name__ == "__main__":
    test_numbers = [1, 2, 4, 7, 13, 15, 19, 21]
    for num in test_numbers:
        print(f"Number {num} is prime? {is_prime(num)}")