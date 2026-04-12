from __future__ import annotations

import os
import argparse
from pathlib import Path

from openai import OpenAI
from pymongo import MongoClient

LANGS = [
    ('ENGLISH', 'English'),
    ('HINDI', 'Hindi (Devanagari script)'),
    ('MARATHI', 'Marathi (Devanagari script)'),
    ('TAMIL', 'Tamil (Tamil script)'),
    ('TELUGU', 'Telugu (Telugu script)'),
    ('KANNADA', 'Kannada (Kannada script)'),
    ('MALAYALAM', 'Malayalam (Malayalam script)'),
]


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


def extract_english_block(content: str) -> str:
    lines = (content or '').splitlines()
    current = None
    capture = []
    section_tags = {tag for tag, _ in LANGS}

    for line in lines:
        tag = line.strip().upper()
        if tag in section_tags:
            current = tag
            continue
        if current == 'ENGLISH':
            capture.append(line)

    text = '\n'.join(capture).strip()
    return text if text else (content or '').strip()


def translate_text(client: OpenAI, text: str, target_language_label: str) -> str:
    system = (
        'You are a professional educational translator for coding lessons. '
        'Translate naturally for first-year engineering students. '
        'Preserve structure, headings, numbering, and bullet points. '
        'Keep code snippets, identifiers, and keywords (Python, if, else, for, while, break, continue, print, int, float, str, bool) in English. '
        'Return only translated lesson text. No markdown fences, no commentary.'
    )
    user = (
        f'Translate the following lesson to {target_language_label}. '
        'Keep the same educational depth and same format.\n\n'
        f'{text}'
    )

    resp = client.chat.completions.create(
        model='deepseek-chat',
        temperature=0.2,
        messages=[
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': user},
        ],
    )
    out = (resp.choices[0].message.content or '').strip()
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--start-order', type=int, default=1)
    parser.add_argument('--end-order', type=int, default=5)
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[1]
    load_env_file(project_root / '.env')

    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    mongo_db = os.getenv('MONGO_DB_NAME', 'velora')
    api_key = os.getenv('DEEPSEEK_API_KEY', '').strip()

    if not api_key:
        print('Missing DEEPSEEK_API_KEY in environment/.env')
        return 1

    client = OpenAI(api_key=api_key, base_url='https://api.deepseek.com')
    db = MongoClient(mongo_url)[mongo_db]

    query = {'course_slug': 'python-foundations', 'order': {'$gte': args.start_order, '$lte': args.end_order}}
    projection = {'_id': 1, 'order': 1, 'title': 1, 'content': 1}

    for doc in db.lessons.find(query, projection).sort('order', 1):
        order = doc['order']
        title = doc.get('title', f'Lesson {order}')
        english = extract_english_block(doc.get('content', ''))
        if not english:
            print(f'Skipping lesson {order} ({title}) - empty source text')
            continue

        print(f'Translating lesson {order}: {title}')
        sections: list[str] = []
        for tag, label in LANGS:
            if tag == 'ENGLISH':
                translated = english
            else:
                translated = translate_text(client, english, label)
            sections.append(tag)
            sections.append(translated.strip())
            sections.append('')

        new_content = '\n'.join(sections).strip() + '\n'
        db.lessons.update_one({'_id': doc['_id']}, {'$set': {'content': new_content}})
        print(f'Updated lesson {order}')

    print('All requested lessons translated and updated.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
