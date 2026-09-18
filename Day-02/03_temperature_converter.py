"""
Task: Temperature Converter
Logic:
- Converts Celsius to Fahrenheit: (C * 9/5) + 32
- Converts Celsius to Kelvin: C + 273.15
- Returns multiple values as an unpacked tuple.
"""

def convert_celsius(celsius: float):
    fahrenheit = (celsius * 9 / 5) + 32
    kelvin = celsius + 273.15
    return round(fahrenheit, 2), round(kelvin, 2)

if __name__ == "__main__":
    # Test Case 1: Body Temperature
    c_temp = 37.0
    f, k = convert_celsius(c_temp)
    print(f"Celsius: {c_temp}°C -> Fahrenheit: {f}°F | Kelvin: {k}K")

    # Test Case 2: Boiling Point
    water_boil = 100.0
    f_boil, k_boil = convert_celsius(water_boil)
    print(f"Celsius: {water_boil}°C -> Fahrenheit: {f_boil}°F | Kelvin: {k_boil}K")