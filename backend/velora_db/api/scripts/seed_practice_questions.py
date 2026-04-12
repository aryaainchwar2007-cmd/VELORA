from datetime import datetime, timezone
from pymongo import ASCENDING, MongoClient


def now_utc():
    return datetime.now(timezone.utc)


def q(no, title, difficulty, statement, tests):
    return {
        'question_no': no,
        'problem_code': f'Q{no:03d}',
        'title': title,
        'difficulty': difficulty,
        'problem_statement': statement,
        'test_cases': tests,
        'is_active': True,
        'updated_at': now_utc(),
    }


QUESTIONS = [
    q(1, 'Sum of Two Numbers', 'Easy', 'Write a program to take two integers as input and print their sum.', [
        {'input': '3 5', 'output': '8'},
        {'input': '-2 10', 'output': '8'},
        {'input': '0 0', 'output': '0'},
    ]),
    q(2, 'Even or Odd', 'Easy', 'Write a program to check whether a given integer is even or odd.', [
        {'input': '4', 'output': 'Even'},
        {'input': '7', 'output': 'Odd'},
        {'input': '0', 'output': 'Even'},
    ]),
    q(3, 'Largest of Three Numbers', 'Easy', 'Write a program to find the largest among three given numbers.', [
        {'input': '3 7 5', 'output': '7'},
        {'input': '-1 -5 -3', 'output': '-1'},
        {'input': '10 10 2', 'output': '10'},
    ]),
    q(4, 'Factorial', 'Easy', 'Write a program to calculate the factorial of a given non-negative integer.', [
        {'input': '5', 'output': '120'},
        {'input': '0', 'output': '1'},
        {'input': '3', 'output': '6'},
    ]),
    q(5, 'Reverse a String', 'Easy', 'Write a program to reverse a given string.', [
        {'input': 'hello', 'output': 'olleh'},
        {'input': 'python', 'output': 'nohtyp'},
        {'input': 'a', 'output': 'a'},
    ]),
    q(6, 'Count Vowels', 'Easy', 'Write a program to count the number of vowels in a given string.', [
        {'input': 'hello', 'output': '2'},
        {'input': 'xyz', 'output': '0'},
        {'input': 'education', 'output': '5'},
    ]),
    q(7, 'Sum of Digits', 'Easy', 'Write a program to calculate the sum of digits of a given integer.', [
        {'input': '123', 'output': '6'},
        {'input': '999', 'output': '27'},
        {'input': '0', 'output': '0'},
    ]),
    q(8, 'Prime Number Check', 'Medium', 'Write a program to check whether a given number is prime or not.', [
        {'input': '7', 'output': 'Prime'},
        {'input': '10', 'output': 'Not Prime'},
        {'input': '1', 'output': 'Not Prime'},
    ]),
    q(9, 'Fibonacci Series', 'Medium', 'Write a program to print the first N terms of the Fibonacci sequence.', [
        {'input': '5', 'output': '0 1 1 2 3'},
        {'input': '1', 'output': '0'},
        {'input': '7', 'output': '0 1 1 2 3 5 8'},
    ]),
    q(10, 'Palindrome Number', 'Medium', 'Write a program to check whether a given number is a palindrome.', [
        {'input': '121', 'output': 'Yes'},
        {'input': '123', 'output': 'No'},
        {'input': '7', 'output': 'Yes'},
    ]),
    q(11, 'Count Words in Sentence', 'Medium', 'Write a program to count the number of words in a given sentence.', [
        {'input': 'hello world', 'output': '2'},
        {'input': 'python is awesome', 'output': '3'},
        {'input': 'hi', 'output': '1'},
    ]),
    q(12, 'Second Largest Element', 'Medium', 'Write a program to find the second largest element in a list of integers.', [
        {'input': '[1, 5, 3, 9, 7]', 'output': '7'},
        {'input': '[10, 10, 9]', 'output': '9'},
        {'input': '[2, 1]', 'output': '1'},
    ]),
    q(13, 'Anagram Check', 'Difficult', 'Write a program to check whether two given strings are anagrams of each other.', [
        {'input': 'listen silent', 'output': 'Yes'},
        {'input': 'hello world', 'output': 'No'},
        {'input': 'race care', 'output': 'Yes'},
    ]),
    q(14, 'Longest Word in a Sentence', 'Difficult', 'Write a program to find the longest word in a given sentence. If multiple words have the same maximum length, return the first one.', [
        {'input': 'python is very powerful', 'output': 'powerful'},
        {'input': 'I love coding', 'output': 'coding'},
        {'input': 'hi all', 'output': 'hi'},
    ]),
    q(15, 'Remove Duplicates from List', 'Difficult', 'Write a program to remove duplicate elements from a list while preserving the order.', [
        {'input': '[1,2,2,3,4,4]', 'output': '[1,2,3,4]'},
        {'input': '[5,5,5]', 'output': '[5]'},
        {'input': '[1,2,3]', 'output': '[1,2,3]'},
    ]),
]


def main():
    db = MongoClient('mongodb://localhost:27017')['velora']
    col = db['practice_problems']

    col.create_index([('question_no', ASCENDING)], unique=True)
    col.create_index([('difficulty', ASCENDING), ('question_no', ASCENDING)])

    for item in QUESTIONS:
        col.update_one(
            {'question_no': item['question_no']},
            {
                '$set': item,
                '$setOnInsert': {'created_at': now_utc()},
            },
            upsert=True,
        )
        print(f"Upserted Q{item['question_no']}: {item['title']}")

    print(f"Done. Total practice problems: {col.count_documents({})}")


if __name__ == '__main__':
    main()
