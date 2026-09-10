import re
import math
import hashlib
import os
from collections import Counter
from typing import List, Dict, Optional

import joblib

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

from .models import (
    StructureResponse,
    DuplicateCheckResponse,
    MatchRequest,
    MatchResponse,
    MatchCandidate,
    SimilarComplaint,
)

try:
    import joblib
except ImportError:
    joblib = None

from . import db as db_module

# Confidence thresholds below which we fall back to the keyword-based logic.
CATEGORY_CONFIDENCE_THRESHOLD = 0.35
SEVERITY_CONFIDENCE_THRESHOLD = 0.45

_MODEL_DIR = os.path.join(os.path.dirname(__file__), "model_artifacts")
_category_model = None
_severity_model = None

if joblib is not None:
    try:
        _category_model = joblib.load(os.path.join(_MODEL_DIR, "category_model.joblib"))
        _severity_model = joblib.load(os.path.join(_MODEL_DIR, "severity_model.joblib"))
    except Exception:
        _category_model = None
        _severity_model = None

# Sentence transformer for semantic duplicate detection.
_st_model = None
if SentenceTransformer is not None:
    try:
        _st_model = SentenceTransformer("all-MiniLM-L6-v2")
    except Exception:
        _st_model = None

# In-memory fallback (used when DB is unavailable)
_stored_embeddings: List[Dict] = []
_MAX_STORED = 500


CATEGORIES = [
    "Infrastructure",
    "Environment",
    "Education",
    "Health",
    "Safety",
    "Public Transport",
    "Other",
]

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Infrastructure": ["road", "pothole", "bridge", "building", "construction", "drain", "water", "electricity", "power", "damaged"],
    "Environment": ["pollution", "waste", "garbage", "tree", "forest", "river", "lake", "air", "noise", "dumping", "clean"],
    "Education": ["school", "teacher", "student", "education", "classroom", "college", "learning", "library", "tuition"],
    "Health": ["hospital", "disease", "clinic", "health", "medicine", "doctor", "vaccine", "sanitation", "illness"],
    "Safety": ["crime", "fire", "theft", "violence", "accident", "police", "unsafe", "harassment", "attack"],
    "Public Transport": ["bus", "traffic", "train", "metro", "transport", "vehicles", "commute", "station", "taxi"],
}

SEVERITY_KEYWORDS: Dict[str, List[str]] = {
    "CRITICAL": ["emergency", "immediate", "life-threatening", "fatal", "collapse", "fire", "explosion", "dangerous"],
    "HIGH": ["urgent", "severe", "critical", "deadly", "hazardous", "serious", "broken", "accident"],
    "MEDIUM": ["moderate", "concern", "issue", "problem", "needs", "damaged", "inconvenience"],
    "LOW": ["minor", "small", "suggestion", "improvement", "cosmetic", "request"],
}

SEVERITY_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for", "with", "is",
    "are", "was", "were", "be", "been", "being", "this", "that", "these", "those", "it", "its",
    "as", "by", "from", "we", "they", "he", "she", "there", "here", "about", "into", "over",
    "under", "not", "no", "can", "should", "would", "could", "please", "need", "needs", "has",
    "have", "had", "our", "my", "your", "their", "very", "more", "most", "some", "such", "than",
}


def _tokenize(text: str) -> List[str]:
    tokens = re.findall(r"[a-zA-Z]+", text.lower())
    return [t for t in tokens if t not in STOPWORDS and len(t) > 2]


def _best_category(tokens: List[str]) -> str:
    scores: Dict[str, int] = {c: 0 for c in CATEGORIES}
    for token in tokens:
        for category, keywords in CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if token == kw or token.startswith(kw) or kw in token:
                    scores[category] += 1
    best = max(scores, key=lambda k: scores[k])
    if scores[best] == 0:
        return "Other"
    return best


def _best_severity(text: str) -> str:
    lowered = text.lower()
    for level in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        for kw in SEVERITY_KEYWORDS[level]:
            if kw in lowered:
                return level
    return "LOW"


def _extract_tags(tokens: List[str], limit: int = 6) -> List[str]:
    freq = Counter(tokens)
    ordered = [word for word, _ in freq.most_common(limit + 5)]
    return ordered[:limit]


def _classify_category(text: str, tokens: List[str]) -> str:
    if _category_model is not None:
        proba = _category_model.predict_proba([text])[0]
        confidence = max(proba)
        if confidence >= CATEGORY_CONFIDENCE_THRESHOLD:
            return _category_model.predict([text])[0]
    return _best_category(tokens)


def _classify_severity(text: str) -> str:
    if _severity_model is not None:
        proba = _severity_model.predict_proba([text])[0]
        confidence = max(proba)
        if confidence >= SEVERITY_CONFIDENCE_THRESHOLD:
            return _severity_model.predict([text])[0]
    return _best_severity(text)


def structure_service(text: str) -> StructureResponse:
    tokens = _tokenize(text)
    category = _classify_category(text, tokens)
    severity = _classify_severity(text)
    tags = _extract_tags(tokens)
    return StructureResponse(category=category, severity=severity, tags=tags)


def text_to_embedding(text: str, dim: int = 384) -> List[float]:
    if _st_model is not None:
        return _st_model.encode(text, normalize_embeddings=True, show_progress_bar=False).tolist()
    # Fallback: bag-of-words hashing embedding (no semantic understanding)
    tokens = _tokenize(text)
    vec = [0.0] * dim
    for token in tokens:
        h = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        vec[idx] += 1.0
    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


_stored_embeddings: List[Dict] = []
_MAX_STORED = 50


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    if len(a) != len(b) or not a:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return the great-circle distance in metres between two lat/lon points."""
    r = 6371000.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlam / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _address_similarity(a: Optional[str], b: Optional[str]) -> float:
    """Token-set Jaccard similarity between two address strings."""
    if not a or not b:
        return 0.0
    ta = set(_tokenize(a))
    tb = set(_tokenize(b))
    if not ta or not tb:
        return 0.0
    inter = len(ta & tb)
    union = len(ta | tb)
    return inter / union if union else 0.0


def _get_candidates(address, latitude, longitude, embedding, problem_similarity_threshold, address_similarity_threshold, max_geographic_distance_m):
    """Fetch stored embeddings from DB (with in-memory fallback)."""
    session = db_module.get_session()
    if session is not None:
        try:
            rows = db_module.fetch_all(session)
        finally:
            session.close()
        entries = rows
    else:
        entries = _stored_embeddings

    candidates: List[SimilarComplaint] = []

    for entry in entries:
        prob_sim = _cosine_similarity(embedding, entry["embedding"])
        addr_sim = _address_similarity(address, entry.get("address"))

        dist_m = None
        if (latitude is not None and entry.get("latitude") is not None
                and longitude is not None and entry.get("longitude") is not None):
            dist_m = _haversine_m(latitude, longitude,
                                  entry["latitude"], entry["longitude"])

        addr_component = addr_sim
        if dist_m is not None and dist_m <= max_geographic_distance_m:
            addr_component = max(addr_component, 0.85)
        elif dist_m is not None:
            decay = max(0.0, 1.0 - dist_m / (max_geographic_distance_m * 5))
            addr_component = max(addr_component, decay * 0.85)

        confidence = 0.5 * prob_sim + 0.5 * addr_component

        candidates.append(SimilarComplaint(
            id=entry["id"],
            problem_similarity=round(prob_sim, 4),
            address_similarity=round(addr_sim, 4),
            distance_m=round(dist_m, 1) if dist_m is not None else None,
            confidence=round(confidence, 4),
        ))

    candidates.sort(key=lambda c: c.confidence, reverse=True)
    return candidates


def duplicate_check_service(
    text: str,
    threshold: float = 0.55,
    address: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    problem_similarity_threshold: float = 0.70,
    address_similarity_threshold: float = 0.60,
    max_geographic_distance_m: float = 1000.0,
) -> DuplicateCheckResponse:
    embedding = text_to_embedding(text)
    candidates = _get_candidates(
        address, latitude, longitude, embedding,
        problem_similarity_threshold, address_similarity_threshold,
        max_geographic_distance_m,
    )
    top = candidates[0] if candidates else None

    if top is None or top.problem_similarity < problem_similarity_threshold:
        return DuplicateCheckResponse(
            status="NEW_COMPLAINT",
            isDuplicate=False,
            problem_similarity=top.problem_similarity if top else None,
            address_similarity=top.address_similarity if top else None,
            distance_m=top.distance_m if top else None,
            confidence=top.confidence if top else None,
            similar_complaints=candidates[:5],
        )

    location_ok = False
    if top.address_similarity >= address_similarity_threshold:
        location_ok = True
    elif top.distance_m is not None and top.distance_m <= max_geographic_distance_m:
        location_ok = True

    if not location_ok:
        return DuplicateCheckResponse(
            status="NEW_COMPLAINT",
            isDuplicate=False,
            problem_similarity=top.problem_similarity,
            address_similarity=top.address_similarity,
            distance_m=top.distance_m,
            confidence=top.confidence,
            similar_complaints=candidates[:5],
        )

    status = "LIKELY_DUPLICATE" if top.confidence >= 0.80 else "POSSIBLE_DUPLICATE"

    return DuplicateCheckResponse(
        status=status,
        isDuplicate=True,
        problem_similarity=top.problem_similarity,
        address_similarity=top.address_similarity,
        distance_m=top.distance_m,
        confidence=top.confidence,
        duplicate_of_id=top.id,
        similar_complaints=candidates[:5],
    )


def store_embedding_service(problem_id, text, address=None, latitude=None, longitude=None):
    """Store a complaint embedding in the database (or in-memory fallback)."""
    embedding = text_to_embedding(text)
    session = db_module.get_session()
    if session is not None:
        try:
            req = db_module.StoreEmbeddingRequest(
                problem_id=problem_id,
                text=text,
                embedding=embedding,
                address=address,
                latitude=latitude,
                longitude=longitude,
            )
            db_module.store(session, req)
            return True
        finally:
            session.close()
    else:
        existing = [e for e in _stored_embeddings if e["id"] == problem_id]
        if existing:
            existing[0].update({
                "embedding": embedding, "address": address,
                "latitude": latitude, "longitude": longitude,
            })
        else:
            new_id = (_stored_embeddings[-1]["id"] + 1) if _stored_embeddings else 1
            _stored_embeddings.append({
                "id": new_id,
                "embedding": embedding,
                "address": address,
                "latitude": latitude,
                "longitude": longitude,
            })
            if len(_stored_embeddings) > _MAX_STORED:
                _stored_embeddings.pop(0)
        return True


TEAMS: List[Dict] = [
    {"id": 1, "name": "City Builders", "skill_tags": ["road", "bridge", "construction", "water"], "category_interests": ["Infrastructure"], "capacity": 10, "current_load": 3},
    {"id": 2, "name": "Green Earth", "skill_tags": ["pollution", "waste", "tree", "clean"], "category_interests": ["Environment"], "capacity": 8, "current_load": 2},
    {"id": 3, "name": "EduFirst", "skill_tags": ["school", "teacher", "learning", "library"], "category_interests": ["Education"], "capacity": 12, "current_load": 7},
    {"id": 4, "name": "MediCare Volunteers", "skill_tags": ["hospital", "health", "medicine", "doctor"], "category_interests": ["Health"], "capacity": 15, "current_load": 9},
    {"id": 5, "name": "Safe Streets", "skill_tags": ["crime", "fire", "police", "safety"], "category_interests": ["Safety"], "capacity": 9, "current_load": 4},
    {"id": 6, "name": "Transit Squad", "skill_tags": ["bus", "traffic", "train", "metro"], "category_interests": ["Public Transport"], "capacity": 7, "current_load": 1},
    {"id": 7, "name": "Infra Experts", "skill_tags": ["drain", "electricity", "building", "road"], "category_interests": ["Infrastructure", "Environment"], "capacity": 11, "current_load": 6},
    {"id": 8, "name": "Educate All", "skill_tags": ["student", "education", "college", "tuition"], "category_interests": ["Education"], "capacity": 10, "current_load": 2},
    {"id": 9, "name": "Health Guard", "skill_tags": ["clinic", "disease", "sanitation", "vaccine"], "category_interests": ["Health", "Environment"], "capacity": 13, "current_load": 5},
    {"id": 10, "name": "Neighborhood Watch", "skill_tags": ["security", "safety", "theft", "community"], "category_interests": ["Safety", "Public Transport"], "capacity": 14, "current_load": 8},
    {"id": 11, "name": "Eco Warriors", "skill_tags": ["river", "forest", "air", "waste"], "category_interests": ["Environment"], "capacity": 6, "current_load": 1},
    {"id": 12, "name": "Road Responders", "skill_tags": ["pothole", "traffic", "vehicles", "construction"], "category_interests": ["Infrastructure", "Public Transport"], "capacity": 9, "current_load": 5},
    {"id": 13, "name": "Learn Together", "skill_tags": ["teacher", "classroom", "library", "learning"], "category_interests": ["Education"], "capacity": 8, "current_load": 3},
    {"id": 14, "name": "Rapid Rescue", "skill_tags": ["emergency", "fire", "medical", "safety"], "category_interests": ["Safety", "Health"], "capacity": 16, "current_load": 10},
    {"id": 15, "name": "Commute Crew", "skill_tags": ["bus", "station", "metro", "taxi"], "category_interests": ["Public Transport"], "capacity": 7, "current_load": 2},
]


def match_service(problem: MatchRequest) -> MatchResponse:
    candidate_pool = problem.tags + [problem.category.lower()] + [problem.severity.lower()]
    scored = []
    for team in TEAMS:
        overlap_items = set(candidate_pool) & (set(team["skill_tags"]) | {c.lower() for c in team["category_interests"]})
        skill_match = len(overlap_items) / max(1, len(candidate_pool))

        cap = max(1, team["capacity"])
        load_ratio = min(1.0, team["current_load"] / cap)
        availability = 1.0 - load_ratio

        score = 0.5 * skill_match + 0.5 * availability

        scored.append(
            MatchCandidate(
                teamId=team["id"],
                teamName=team["name"],
                score=round(score, 4),
                skillMatch=round(skill_match, 4),
                capacityLeft=max(0, team["capacity"] - team["current_load"]),
            )
        )

    scored.sort(key=lambda c: c.score, reverse=True)
    return MatchResponse(candidates=scored[:10])
