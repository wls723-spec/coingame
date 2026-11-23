import os
import sqlite3
from fastapi import FastAPI

DB_PATH = "/workspace/data/app.db"

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection

def init_db():
    with get_db() as connection:
        connection.execute("""CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            score INTEGER NOT NULL,
            prizes TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )""")

app = FastAPI()
init_db()

@app.get("/api/health")
def health():
    return {"ok": True}
