from fastapi import FastAPI

app = FastAPI(
    title="Crisis Resource Conflict Resolution Platform",
    description="Backend API for crisis resource coordination and conflict resolution.",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Crisis Resource Conflict Resolution Platform API"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }