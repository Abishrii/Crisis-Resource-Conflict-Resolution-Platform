from fastapi import FastAPI

from app.database import Base, engine
from app.models.user import User
from app.models.help_request import HelpRequest
from app.models.resource import Resource
from app.routers.users import router as users_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Crisis Resource Conflict Resolution Platform",
    description="Backend API for crisis resource coordination and conflict resolution.",
    version="1.0.0"
)


app.include_router(users_router)


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