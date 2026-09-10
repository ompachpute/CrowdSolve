from fastapi import APIRouter, HTTPException

from .models import (
    StructureRequest,
    StructureResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    StoreEmbeddingRequest,
    StoreEmbeddingResponse,
    MatchRequest,
    MatchResponse,
)
from . import services

router = APIRouter(prefix="/ai")


@router.post("/structure", response_model=StructureResponse)
def structure(request: StructureRequest) -> StructureResponse:
    text = f"{request.title}. {request.description}"
    return services.structure_service(text)


@router.post("/duplicate-check", response_model=DuplicateCheckResponse)
def duplicate_check(request: DuplicateCheckRequest) -> DuplicateCheckResponse:
    return services.duplicate_check_service(
        text=request.text,
        address=request.address,
        latitude=request.latitude,
        longitude=request.longitude,
        problem_similarity_threshold=request.problem_similarity_threshold,
        address_similarity_threshold=request.address_similarity_threshold,
        max_geographic_distance_m=request.max_geographic_distance_m,
    )


@router.post("/store-embedding", response_model=StoreEmbeddingResponse)
def store_embedding(request: StoreEmbeddingRequest) -> StoreEmbeddingResponse:
    ok = services.store_embedding_service(
        problem_id=request.problem_id,
        text=request.text,
        address=request.address,
        latitude=request.latitude,
        longitude=request.longitude,
    )
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to store embedding")
    return StoreEmbeddingResponse(stored=True, problem_id=request.problem_id)


@router.post("/match", response_model=MatchResponse)
def match(request: MatchRequest) -> MatchResponse:
    return services.match_service(request)