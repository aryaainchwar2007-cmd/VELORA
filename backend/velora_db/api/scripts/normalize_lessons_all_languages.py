from pymongo import MongoClient

LANGS = ['ENGLISH', 'HINDI', 'MARATHI', 'TAMIL', 'TELUGU', 'KANNADA', 'MALAYALAM']


def normalize_spaces(s: str) -> str:
    return '\n'.join(line.rstrip() for line in s.splitlines()).strip()


def extract_english_block(content: str) -> str:
    lines = content.splitlines()
    current = None
    acc = {lang: [] for lang in LANGS}

    for line in lines:
        tag = line.strip().upper()
        if tag in LANGS:
            current = tag
            continue
        if current:
            acc[current].append(line)

    english = normalize_spaces('\n'.join(acc.get('ENGLISH', [])))
    if english:
        return english
    # fallback: whole content
    return normalize_spaces(content)


def build_all_languages_block(base: str) -> str:
    sections = []
    for lang in LANGS:
        sections.append(lang)
        sections.append(base)
        sections.append('')
    return '\n'.join(sections).strip() + '\n'


client = MongoClient('mongodb://localhost:27017')
db = client['velora']

cursor = db.lessons.find({'course_slug': 'python-foundations', 'order': {'$gte': 1, '$lte': 5}}, {'_id': 1, 'order': 1, 'content': 1})
count = 0
for doc in cursor:
    base = extract_english_block(doc.get('content', ''))
    rebuilt = build_all_languages_block(base)
    db.lessons.update_one({'_id': doc['_id']}, {'$set': {'content': rebuilt}})
    count += 1
    print(f"Updated lesson {doc.get('order')}")

print(f"Done. Updated {count} lessons.")
