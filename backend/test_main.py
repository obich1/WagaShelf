import pytest
from fastapi.testclient import TestClient
from main import app
import database

VALID_DATA = {
    "title":"one piece",
    "type": "Anime",
    "status": "completed",
    "rating":10,
    "anilist_id":12345,
    "chapters":None,
    "episodes":1258,
    "cover":"onepiece.png"
    }


@pytest.fixture
def client(tmp_path,monkeypatch):
    test = tmp_path/"test.db"
    monkeypatch.setattr(database,"DATABASE_FILE",str(test))

    database.create_table()

    return TestClient(app)


@pytest.fixture
def created_entry(client):
    return client.post("/entries",json=VALID_DATA).json()



def test_get_entries_empty(client):
    response = client.get("/entries")
    assert response.status_code == 200
    assert response.json() == []


def test_add_valid_entry(client):
    response = client.post("/entries",json=VALID_DATA)
    assert response.status_code == 201
    assert response.json()["id"]
    assert response.json()["title"] == VALID_DATA["title"]

def test_add_null_title(client):
    data_copy = VALID_DATA.copy()
    data_copy["title"] = None
    response = client.post("/entries",json=data_copy)
    assert response.status_code == 422

def test_add_missing_title(client):
    data_copy = VALID_DATA.copy()
    data_copy.pop("title")
    response = client.post("/entries",json=data_copy)
    assert response.status_code == 422

def test_add_incorrect_rating(client):
    data_copy = VALID_DATA.copy()
    data_copy["rating"] = 20
    response = client.post("/entries",json=data_copy)
    assert response.status_code == 422

def test_add_incorrect_type(client):
    data_copy = VALID_DATA.copy()
    data_copy["type"] = "books"
    response = client.post("/entries",json=data_copy)
    assert response.status_code == 422

def test_add_incorrect_status(client):
    data_copy = VALID_DATA.copy()
    data_copy["status"] = "banana"
    response = client.post("/entries",json=data_copy)
    assert response.status_code == 422

def test_add_manual_entry(client):
    data_copy = VALID_DATA.copy()
    data_copy["anilist_id"] = None
    data_copy["rating"] = None
    data_copy["cover"] = None
    response = client.post("/entries",json=data_copy)
    assert response.status_code == 201
    assert response.json()["anilist_id"] is None
    assert response.json()["rating"] is None
    assert response.json()["cover"] is None



def test_get_after_post(client):
    client.post("/entries",json=VALID_DATA)
    client.post("/entries",json=VALID_DATA)
    response = client.get("/entries")
    assert len(response.json()) == 2

def test_update_rating_only(client, created_entry):
    response = client.patch(f"/entries/{created_entry['id']}", json={"rating":8})
    assert response.status_code == 200
    assert response.json()["rating"] == 8
    assert response.json()["title"] == created_entry["title"]


def test_update_null_rating(client, created_entry):
    response = client.patch(f"/entries/{created_entry['id']}",json={"rating":None})
    assert response.status_code == 200
    assert response.json()["rating"] is None


def test_update_null_title(client, created_entry):
    response = client.patch(f"/entries/{created_entry['id']}",json={"title":None})
    assert response.status_code == 422

def test_update_with_missing_id(client):
    response = client.patch("/entries/999",json={"rating":None})
    assert response.status_code == 404

def test_delete_entry(client, created_entry):
    response = client.delete(f"/entries/{created_entry['id']}")
    assert response.status_code == 200
    assert client.get("/entries").json() == []


def test_delete_with_missing_id(client):
    response = client.delete("/entries/999")
    assert response.status_code == 404