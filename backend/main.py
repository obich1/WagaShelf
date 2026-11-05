from fastapi import FastAPI,HTTPException
from database import get_connection,create_table
from models import EntryCreate,EntryUpdate

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

@app.post("/entries",status_code=201)
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

@app.delete("/entries/{entry_id}")
def delete_entry(entry_id: int):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("DELETE FROM entries WHERE id = ?",(entry_id,))
    connection.commit()
    deleted_rows = cursor.rowcount
    connection.close()
    if deleted_rows == 0:
        raise HTTPException(status_code=404, detail="Entry not found")

    return {"deleted": entry_id}

@app.patch("/entries/{entry_id}")
def update_entry(entry_id: int,new_entry:EntryUpdate ):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM entries WHERE id = ?",(entry_id,))
    entry = cursor.fetchone()
    if entry is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Entry not found")
    dict_entry = dict(entry)
    new_update = new_entry.model_dump(exclude_unset=True)
    dict_entry.update(new_update)
    cursor.execute("UPDATE entries SET anilist_id = :anilist_id ,title = :title,type = :type"
                   ",status = :status,chapters = :chapters,episodes = :episodes,rating = :rating,cover = :cover WHERE id = :id",dict_entry)
    connection.commit()
    connection.close()
    return dict_entry



