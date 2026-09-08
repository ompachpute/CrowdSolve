from pydantic import BaseModel
from typing import List, Optional


class StructureRequest(BaseModel):
    title: str
    description: str


class StructureResponse(BaseModel):
    category: str
    severity: str
    tags: List[str]


class DuplicateCheckRequest(BaseModel):
    embedding: List[float]
    threshold: float = 0.85
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class DuplicateCheckResponse(BaseModel):
    isDuplicate: bool
    duplicateOfId: Optional[int] = None
    similarityScore: Optional[float] = None


class MatchCandidate(BaseModel):
    teamId: int
    teamName: str
    score: float
    skillMatch: float
    capacityLeft: int


class MatchRequest(BaseModel):
    title: str
    description: str
    category: str
    severity: Optional[str] = "MEDIUM"
    tags: Optional[List[str]] = []
    location: Optional[str] = None


class MatchResponse(BaseModel):
    candidates: List[MatchCandidate]
