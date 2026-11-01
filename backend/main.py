from fastapi import FastAPI
from database import get_connection,create_table
from models import EntryCreate

app = FastAPI()
create_table()

@app.get("/entries")
def get_entries():
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM entries")
    entries = cursor.fetchall()
    connection.close()
    return [dict(entry) for entry in entries]

@app.post("/entries")
def add_entry(entry: EntryCreate):
    connection = get_connection()
    cursor = connection.cursor()
    data = entry.model_dump()
    cursor.execute("INSERT INTO entries (anilist_id,title,type,status,chapters,episodes,rating,cover) VALUES(:anilist_id,:title,:type,:status,:chapters,:episodes,:rating,:cover)",data)
    connection.commit()
    new_id  = cursor.lastrowid
    data["id"] = new_id
    connection.close()
    return data
