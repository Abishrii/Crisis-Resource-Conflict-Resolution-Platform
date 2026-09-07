from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.database import Base


class HelpRequest(Base):
    __tablename__ = "help_requests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    urgency = Column(String, nullable=False)
    status = Column(String, default="PENDING")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)