from __future__ import annotations

import argparse
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path
import xml.etree.ElementTree as ET

from pymongo import MongoClient


W_NS = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r'[^a-z0-9]+', '-', value)
    return value.strip('-') or 'item'


def extract_docx_text(path: Path) -> str:
    with zipfile.ZipFile(path, 'r') as zf:
        xml_data = zf.read('word/document.xml')

    root = ET.fromstring(xml_data)
    paragraphs: list[str] = []

    for p in root.iter(f'{W_NS}p'):
        runs: list[str] = []
        for t in p.iter(f'{W_NS}t'):
            runs.append(t.text or '')
        line = ''.join(runs).strip()
        if line:
            paragraphs.append(line)

    return '\n'.join(paragraphs)


def parse_order_and_title(path: Path) -> tuple[int, str]:
    stem = path.stem.strip()
    m = re.match(r'^(\d+)\s*[.\-)]\s*(.+)$', stem)
    if m:
        return int(m.group(1)), m.group(2).strip()
    return 999, stem


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description='Import lesson .docx files into MongoDB')
    parser.add_argument('--mongo-url', required=True)
    parser.add_argument('--db-name', required=True)
    parser.add_argument('--course-title', default='Python Foundations')
    parser.add_argument('--course-slug', default='python-foundations')
    parser.add_argument('files', nargs='+')
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    paths = [Path(p).expanduser() for p in args.files]
    missing = [str(p) for p in paths if not p.exists()]
    if missing:
        for m in missing:
            print(f'Missing file: {m}')
        return 1

    parsed: list[tuple[int, str, Path, str]] = []
    for path in paths:
        order, title = parse_order_and_title(path)
        content = extract_docx_text(path)
        parsed.append((order, title, path, content))

    parsed.sort(key=lambda x: (x[0], x[1].lower()))

    client = MongoClient(args.mongo_url)
    db = client[args.db_name]
    courses = db['courses']
    lessons = db['lessons']

    lessons.create_index([('course_slug', 1), ('order', 1)], unique=True)
    lessons.create_index([('course_slug', 1), ('lesson_slug', 1)], unique=True)
    courses.create_index([('course_slug', 1)], unique=True)

    timestamp = now_utc()
    total_lessons = len(parsed)

    courses.update_one(
        {'course_slug': args.course_slug},
        {
            '$set': {
                'course_slug': args.course_slug,
                'title': args.course_title,
                'description': f'{total_lessons} lesson plans imported from docx.',
                'lesson_count': total_lessons,
                'updated_at': timestamp,
            },
            '$setOnInsert': {'created_at': timestamp},
        },
        upsert=True,
    )

    for order, title, path, content in parsed:
        lesson_slug = slugify(title)
        lessons.update_one(
            {'course_slug': args.course_slug, 'order': order},
            {
                '$set': {
                    'course_slug': args.course_slug,
                    'lesson_slug': lesson_slug,
                    'title': title,
                    'order': order,
                    'source_file': str(path),
                    'content': content,
                    'updated_at': timestamp,
                },
                '$setOnInsert': {'created_at': timestamp},
            },
            upsert=True,
        )
        print(f'Imported lesson {order}: {title}')

    print(f'Done. Imported {total_lessons} lessons into {args.db_name}.lessons')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
