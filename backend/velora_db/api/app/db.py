from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from app.config import settings


client = MongoClient(settings.mongo_url)
database: Database = client[settings.mongo_db_name]


def get_database() -> Database:
    return database


def get_collection(name: str) -> Collection:
    return database[name]


def init_indexes() -> None:
    # Auth-only indexes
    get_collection("students").create_index([("email", ASCENDING)], unique=True)
    get_collection("students").create_index([("username", ASCENDING)], unique=True)
    get_collection("chat_messages").create_index([("user_id", ASCENDING), ("session_id", ASCENDING), ("created_at", ASCENDING)])
    get_collection("chat_sessions").create_index([("user_id", ASCENDING), ("session_id", ASCENDING)], unique=True)
