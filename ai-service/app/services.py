import re
import math
import hashlib
from collections import Counter
from typing import List, Dict, Optional

from .models import (
    StructureResponse,
    DuplicateCheckResponse,
    MatchRequest,
    MatchResponse,
    MatchCandidate,
)


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
    chosen = "LOW"
    for level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        for kw in SEVERITY_KEYWORDS[level]:
            if kw in lowered:
                chosen = level
                break
        if chosen == level:
            break
    return chosen


def _extract_tags(tokens: List[str], limit: int = 6) -> List[str]:
    freq = Counter(tokens)
    ordered = [word for word, _ in freq.most_common(limit + 5)]
    return ordered[:limit]


def structure_service(text: str) -> StructureResponse:
    tokens = _tokenize(text)
    category = _best_category(tokens)
    severity = _best_severity(text)
    tags = _extract_tags(tokens)
    return StructureResponse(category=category, severity=severity, tags=tags)


def text_to_embedding(text: str, dim: int = 256) -> List[float]:
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


def duplicate_check_service(embedding: List[float], threshold: float = 0.85, address: Optional[str] = None, latitude: Optional[float] = None, longitude: Optional[float] = None) -> DuplicateCheckResponse:
    best_id: Optional[int] = None
    best_score = 0.0
    best_entry = None
    
    for entry in _stored_embeddings:
        score = _cosine_similarity(embedding, entry["embedding"])
        if score > best_score:
            best_score = score
            best_id = entry["id"]
            best_entry = entry

    if best_score > threshold and best_id is not None:
        stored_address = best_entry.get("address")
        stored_lat = best_entry.get("latitude")
        stored_lng = best_entry.get("longitude")
        
        if address and stored_address and address.strip() and stored_address.strip():
            if address.strip().lower() != stored_address.strip().lower():
                best_score = best_score * 0.3
            elif latitude is not None and stored_lat is not None and longitude is not None and stored_lng is not None:
                lat_diff = abs(latitude - stored_lat)
                lng_diff = abs(longitude - stored_lng)
                if lat_diff > 0.01 or lng_diff > 0.01:
                    best_score = best_score * 0.3
        
        if best_score > threshold:
            return DuplicateCheckResponse(isDuplicate=True, duplicateOfId=best_id, similarityScore=round(best_score, 4))

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

    return DuplicateCheckResponse(isDuplicate=False, duplicateOfId=None, similarityScore=None)


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
