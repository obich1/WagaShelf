from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {
        "message":"WagaShelf API is running"
    }