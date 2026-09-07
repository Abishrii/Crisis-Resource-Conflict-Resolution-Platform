from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit = Column(String, nullable=False)
    location = Column(String, nullable=False)
    provider = Column(Integer, ForeignKey("users.id"), nullable=False)