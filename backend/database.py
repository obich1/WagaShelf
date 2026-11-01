import sqlite3

DATABASE_FILE = "wagashelf.db"

def get_connection():
    connection = sqlite3.connect(DATABASE_FILE)
    connection.row_factory = sqlite3.Row
    return connection


def create_table():
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("""
            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                anilist_id INTEGER,
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                Chapters_or_Episodes INTEGER,
                status TEXT NOT NULL,
                rating REAL,
                cover TEXT 
                    
            )
    """)

    connection.commit()
    connection.close()