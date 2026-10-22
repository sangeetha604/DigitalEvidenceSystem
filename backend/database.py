import sqlite3

DATABASE = "../storage/evidence.db"

connection = sqlite3.connect(DATABASE)

cursor = connection.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evidence_id TEXT UNIQUE,
    filename TEXT,
    case_id TEXT,
    evidence_type TEXT,
    description TEXT,
    collected_by TEXT,
    collection_location TEXT,
    sha256 TEXT,
    created_at TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS audit_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evidence_id TEXT,
    filename TEXT,
    action TEXT,
    handler TEXT,
    purpose TEXT,
    timestamp TEXT,
    sha256 TEXT,
    previous_hmac TEXT,
    hmac TEXT
)
""")

connection.commit()
connection.close()

print("Database created successfully!")