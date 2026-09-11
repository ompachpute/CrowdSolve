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
    text: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    problem_similarity_threshold: float = 0.70
    address_similarity_threshold: float = 0.60
    max_geographic_distance_m: float = 1000.0


class SimilarComplaint(BaseModel):
    id: int
    problem_similarity: float
    address_similarity: float
    distance_m: Optional[float] = None
    confidence: float


class DuplicateCheckResponse(BaseModel):
    status: str  # "LIKELY_DUPLICATE", "POSSIBLE_DUPLICATE", "NEW_COMPLAINT"
    isDuplicate: bool
    problem_similarity: Optional[float] = None
    address_similarity: Optional[float] = None
    distance_m: Optional[float] = None
    confidence: Optional[float] = None
    duplicate_of_id: Optional[int] = None
    similar_complaints: List[SimilarComplaint] = []


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


class StoreEmbeddingRequest(BaseModel):
    problem_id: int
    text: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class StoreEmbeddingResponse(BaseModel):
    stored: bool
    problem_id: int