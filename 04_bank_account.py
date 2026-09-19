class BankAccount:
    def __init__(self, owner, balance=0.0):
        self.owner = owner
    
        self.__balance = balance

    def deposit(self, amount):
        if amount > 0:
            self.__balance += amount
            print(f"Deposited: ${amount:.2f}")
        else:
            print("Deposit amount must be positive.")

    def withdraw(self, amount):
        if amount <= 0:
            print("Withdrawal amount must be positive.")
        elif amount > self.__balance:
            print("Insufficient funds!")
        else:
            self.__balance -= amount
            print(f"Withdrawn: ${amount:.2f}")

    def get_balance(self):
        return self.__balance

    def __str__(self):
        return f"Account({self.owner}, Balance: ${self.__balance:.2f})"


if __name__ == "__main__":
    acc = BankAccount("Rehana", 100.0)

    print(acc)           
    acc.deposit(50.0)    
    acc.withdraw(30.0)   
    acc.withdraw(200.0)   
    
    print(f"Final Balance: ${acc.get_balance():.2f}")