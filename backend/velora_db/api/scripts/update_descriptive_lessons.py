from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['velora']

lessons = {
    1: '''ENGLISH
Lesson Goal:
By the end of this lesson, you will understand what Python is, why developers love it, and how to run your first Python program confidently.

What You Will Learn:
1. What is Python and why it is beginner-friendly.
2. Where Python is used: web apps, AI/ML, automation, data analysis.
3. How Python executes code line by line.
4. Basic syntax rules: indentation, comments, and print().
5. Writing your first program and reading output.

Core Concepts:
- Python is interpreted, readable, and powerful.
- Indentation is not optional; it defines code blocks.
- Comments (using #) help explain your logic.

Quick Practice:
- Print your name.
- Print your college and branch.
- Print one line with f-string formatting.

Common Mistakes:
- Missing colon after function/condition.
- Incorrect indentation.
- Using quotes incorrectly.

Mini Task:
Create a program that prints:
- Your name
- Your year
- One learning goal for this week

HINDI
Is lesson mein Python ka introduction, use-cases, syntax basics, indentation, aur first program cover hoga.

MARATHI
Ya lesson madhye Python chi olakh, tyache upyog, syntax basics, indentation ani pahila program shiku.

TAMIL
Intha lesson-il Python arimugam, usage areas, basic syntax, indentation, first program kattukolvom.

TELUGU
Ee lesson-lo Python parichayam, use-cases, syntax basics, indentation mariyu first program nerchukuntaru.

KANNADA
Ee lesson nalli Python parichaya, upayogagalu, syntax basics, indentation mattu first program kalitiri.

MALAYALAM
Ee lesson-il Python introduction, use-cases, basic syntax, indentation, first program padikkam.
''',
    2: '''ENGLISH
Lesson Goal:
Understand variables and data types so you can store and manipulate information correctly.

What You Will Learn:
1. Variable naming rules and best practices.
2. Primitive data types: int, float, str, bool.
3. Type checking using type().
4. Type conversion: int(), float(), str(), bool().
5. Input handling and storing user data.

Core Concepts:
- A variable is a named reference to a value.
- Python is dynamically typed, but type awareness is still important.
- Clear variable names improve readability.

Quick Practice:
- Store age, height, and name in separate variables.
- Convert a string number to int and add 10.
- Print variable type for each input.

Common Mistakes:
- Using spaces/special symbols in variable names.
- Mixing int and str without conversion.
- Reusing unclear names like x, y everywhere.

Mini Task:
Take user name and age input, then print:
"Hello <name>, next year you will be <age+1>."

HINDI
Is lesson mein variables, data types, type conversion aur user input handling samjhaya jayega.

MARATHI
Ya lesson madhye variables, data types, conversion ani input handling shiknar.

TAMIL
Intha lesson-il variables, data types, type conversion, input handling padippom.

TELUGU
Ee lesson-lo variables, data types, type conversion, user input handling nerchukuntaru.

KANNADA
Ee lesson nalli variables, data types, conversion mattu input handling kalitiri.

MALAYALAM
Ee lesson-il variables, data types, conversion, input handling padikkam.
''',
    3: '''ENGLISH
Lesson Goal:
Use operators correctly to perform calculations and build logical conditions.

What You Will Learn:
1. Arithmetic operators: +, -, *, /, %, //, **.
2. Comparison operators: ==, !=, >, <, >=, <=.
3. Logical operators: and, or, not.
4. Assignment operators: =, +=, -=, *=.
5. Operator precedence and parentheses.

Core Concepts:
- Expressions combine values and operators to produce results.
- Comparison + logical operators are the base of decision making.
- Parentheses make expressions safer and clearer.

Quick Practice:
- Compute total and average of 3 marks.
- Check if user age is eligible for voting.
- Combine two conditions using and/or.

Common Mistakes:
- Using = instead of == in conditions.
- Confusing / and //.
- Forgetting precedence in mixed expressions.

Mini Task:
Write a program that takes two numbers and prints:
- sum, difference, product
- whether first number is greater than second

HINDI
Yah lesson arithmetic, comparison, logical operators aur precedence ko practical examples ke saath cover karta hai.

MARATHI
Ya lesson madhye arithmetic, comparison, logical operators ani precedence practical udaharanansah shiknar.

TAMIL
Intha lesson arithmetic, comparison, logical operators matrum precedence-ai practical-a cover seyyum.

TELUGU
Ee lesson arithmetic, comparison, logical operators mariyu precedence ni practical examples tho nerpisthundi.

KANNADA
Ee lesson arithmetic, comparison, logical operators mattu precedence annu practical udaharane jothege kalisutte.

MALAYALAM
Ee lesson arithmetic, comparison, logical operators, precedence ennivaye practical example-ode padippikkunnu.
''',
    4: '''ENGLISH
Lesson Goal:
Control program flow using conditions and write clear decision logic.

What You Will Learn:
1. if, elif, else structure.
2. Nested conditions and multi-branch decisions.
3. Truthy/falsy values in Python.
4. Combining conditions with and/or/not.
5. Writing readable conditional code.

Core Concepts:
- Conditions help your program choose the correct path.
- Order of checks matters in if-elif chains.
- Simpler conditions reduce bugs.

Quick Practice:
- Grade calculator using marks range.
- Check odd/even and positive/negative.
- Categorize user by age group.

Common Mistakes:
- Incorrect indentation inside if blocks.
- Overlapping conditions in wrong order.
- Very long condition lines without grouping.

Mini Task:
Build a menu program:
- Input marks
- Print distinction/first class/pass/fail based on ranges

HINDI
Is lesson mein if-elif-else, nested conditions aur clean decision logic cover kiya gaya hai.

MARATHI
Ya lesson madhye if-elif-else, nested conditions ani clean decision logic samjavn dile aahe.

TAMIL
Intha lesson-il if-elif-else, nested conditions, readable decision logic padippom.

TELUGU
Ee lesson-lo if-elif-else, nested conditions, clean decision logic nerchukuntaru.

KANNADA
Ee lesson nalli if-elif-else, nested conditions mattu clean decision logic kalitiri.

MALAYALAM
Ee lesson-il if-elif-else, nested conditions, clean decision logic padikkam.
''',
    5: '''ENGLISH
Lesson Goal:
Automate repetitive tasks with loops and control loop behavior safely.

What You Will Learn:
1. for loop with range().
2. while loop and condition-based repetition.
3. break and continue usage.
4. Loop counters and infinite-loop prevention.
5. Nested loops and simple pattern printing.

Core Concepts:
- for loop is ideal when iteration count is known.
- while loop is ideal when repetition depends on condition.
- break exits loop; continue skips current iteration.

Quick Practice:
- Print 1 to 10 using for and while.
- Print only even numbers in a range.
- Stop loop when user enters "stop".

Common Mistakes:
- Forgetting to update while-loop variable.
- Wrong indentation in nested loops.
- Misusing break/continue and skipping logic unexpectedly.

Mini Task:
Create a multiplication table generator:
- take a number input
- print table from 1 to 10
- skip multiplication by 5 using continue

HINDI
Is lesson mein for/while loops, break-continue, aur loop control ke practical use-cases cover hote hain.

MARATHI
Ya lesson madhye for/while loops, break-continue ani loop control che practical use-cases cover kele aahet.

TAMIL
Intha lesson-il for/while loops, break-continue, loop control practical use-cases paarkkalam.

TELUGU
Ee lesson-lo for/while loops, break-continue, loop control practical use-cases cover chestham.

KANNADA
Ee lesson nalli for/while loops, break-continue mattu loop control practical use-cases kalitiri.

MALAYALAM
Ee lesson-il for/while loops, break-continue, loop control practical use-cases padikkam.
''',
}

for order, content in lessons.items():
    db.lessons.update_one(
        {'course_slug': 'python-foundations', 'order': order},
        {'$set': {'content': content}},
        upsert=False,
    )
    print(f'Updated lesson {order}')

print('Done')
