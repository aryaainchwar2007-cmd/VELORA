from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['velora']

lesson_keywords = {
    1: ['python-basics', 'syntax', 'indentation', 'print', 'input-output'],
    2: ['variables', 'data-types', 'type-conversion', 'input'],
    3: ['operators', 'arithmetic', 'comparison', 'logical', 'expressions'],
    4: ['control-flow', 'decision-making', 'if-elif-else', 'conditions'],
    5: ['loops', 'for-loop', 'while-loop', 'break-continue', 'iteration'],
}

question_links = {
    1: {'lessons': [3], 'keywords': ['operators', 'arithmetic', 'expressions']},
    2: {'lessons': [4, 3], 'keywords': ['control-flow', 'conditions', 'operators']},
    3: {'lessons': [4, 3], 'keywords': ['control-flow', 'comparison', 'conditions']},
    4: {'lessons': [5], 'keywords': ['loops', 'iteration']},
    5: {'lessons': [5], 'keywords': ['loops', 'iteration']},
    6: {'lessons': [5], 'keywords': ['loops', 'iteration']},
    7: {'lessons': [5, 3], 'keywords': ['loops', 'arithmetic', 'operators']},
    8: {'lessons': [5, 4], 'keywords': ['loops', 'control-flow', 'conditions']},
    9: {'lessons': [5], 'keywords': ['loops', 'iteration']},
    10: {'lessons': [5], 'keywords': ['loops', 'iteration']},
    11: {'lessons': [5], 'keywords': ['loops', 'iteration']},
    12: {'lessons': [5], 'keywords': ['loops', 'iteration']},
    13: {'lessons': [5], 'keywords': ['loops', 'iteration']},
    14: {'lessons': [5], 'keywords': ['loops', 'iteration']},
    15: {'lessons': [5], 'keywords': ['loops', 'iteration']},
}

lessons_col = db['lessons']
problems_col = db['practice_problems']

for order, keywords in lesson_keywords.items():
    lessons_col.update_one(
        {'course_slug': 'python-foundations', 'order': order},
        {'$set': {'common_keywords': keywords}},
        upsert=False,
    )
    print(f'Updated lesson {order} keywords')

for qno, link in question_links.items():
    problems_col.update_one(
        {'question_no': qno},
        {
            '$set': {
                'common_keywords': link['keywords'],
                'linked_lesson_orders': link['lessons'],
            }
        },
        upsert=False,
    )
    print(f'Updated question {qno} links')

print('Done')
