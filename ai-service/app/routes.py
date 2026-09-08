from fastapi import APIRouter

from .models import (
    StructureRequest,
    StructureResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
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
    return services.duplicate_check_service(request.embedding, request.threshold)


@router.post("/match", response_model=MatchResponse)
def match(request: MatchRequest) -> MatchResponse:
    return services.match_service(request)
