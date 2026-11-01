from fastapi import FastAPI
from database import get_connection,create_table

app = FastAPI()
create_table()

@app.get("/entries")
def get_entries():
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM entries")
    entries = cursor.fetchall()
    return [dict(entry) for entry in entries]




