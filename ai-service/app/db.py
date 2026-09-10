"""Database-backed duplicate detection for the AI service.

The AI service stores complaint embeddings directly in PostgreSQL so that:
- Embeddings survive container restarts
- There is no 50-entry cap
- The backend can trigger a re-check on any existing complaint
"""
import os
from typing import List, Optional

from sqlalchemy import create_engine, Column, Integer, Text, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.dialects.postgresql import JSON

from pydantic import BaseModel

Base = declarative_base()


class ComplaintEmbedding(Base):
    __tablename__ = "complaint_embeddings"

    id = Column(Integer, primary_key=True)
    problem_id = Column(Integer, nullable=False, index=True)
    text = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=False)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default="now()")


class StoreEmbeddingRequest(BaseModel):
    problem_id: int
    text: str
    embedding: List[float]
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class StoreEmbeddingResponse(BaseModel):
    stored: bool
    problem_id: int


_engine = None
_session_factory = None


def init_db(database_url: str):
    global _engine, _session_factory
    _engine = create_engine(database_url, pool_pre_ping=True)
    Base.metadata.create_all(_engine)
    _session_factory = sessionmaker(bind=_engine)


def get_session() -> Optional[Session]:
    if _session_factory is None:
        return None
    return _session_factory()


def fetch_all(session: Session) -> List[dict]:
    rows = session.query(ComplaintEmbedding).all()
    return [
        {
            "id": r.problem_id,
            "embedding": r.embedding,
            "address": r.address,
            "latitude": r.latitude,
            "longitude": r.longitude,
        }
        for r in rows
    ]


def store(session: Session, req: StoreEmbeddingRequest):
    existing = session.query(ComplaintEmbedding).filter_by(problem_id=req.problem_id).first()
    if existing:
        existing.text = req.text
        existing.embedding = req.embedding
        existing.address = req.address
        existing.latitude = req.latitude
        existing.longitude = req.longitude
    else:
        session.add(ComplaintEmbedding(
            problem_id=req.problem_id,
            text=req.text,
            embedding=req.embedding,
            address=req.address,
            latitude=req.latitude,
            longitude=req.longitude,
        ))
    session.commit()