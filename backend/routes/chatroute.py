"""Authenticated peptide adviser routes for students."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from core.route_handlers import handle_route_errors
from database_entities import UserRole
from dependencies import CurrentUser, require_roles
from models.chat import (
    AdviserBootstrapData,
    AdviserBootstrapResponse,
    ChatHealthData,
    ChatHealthResponse,
    ChatInfoData,
    ChatInfoResponse,
    CreatePatientRequest,
    IntakeRequest,
    PatientDetail,
    PatientDetailResponse,
    PatientListData,
    PatientListResponse,
    PatientMessagesData,
    PatientMessagesResponse,
    SaveIntakeRequest,
    SendMessageRequest,
)
from config import settings
from models.common import success_response
from services.routes.chat import patient_service
from services.routes.chat import service as chat_service

router = APIRouter(prefix="/chat", tags=["chat"])

StudentUser = Annotated[
    CurrentUser,
    Depends(require_roles(UserRole.STUDENT, UserRole.ADMIN)),
]


@router.get("/bootstrap", response_model=AdviserBootstrapResponse)
@handle_route_errors("adviser bootstrap", log_prefix="Chat")
async def adviser_bootstrap(
    current_user: StudentUser,
    patient_id: Optional[str] = Query(default=None),
    message_limit: int = Query(default=settings.chat_messages_page_size, ge=1, le=100),
) -> AdviserBootstrapResponse:
    payload = await patient_service.get_adviser_bootstrap(
        user_id=current_user.user_id,
        patient_id=patient_id,
        message_limit=message_limit,
    )
    return success_response(
        AdviserBootstrapData(
            info=ChatInfoData(**chat_service.get_api_info()),
            flow=chat_service.get_questionnaire_flow(),
            patients=payload["patients"],
            total=payload["total"],
            active_patient=(
                PatientDetail(**payload["active_patient"])
                if payload.get("active_patient")
                else None
            ),
            active_patient_id=payload.get("active_patient_id"),
        )
    )


@router.get("/info", response_model=ChatInfoResponse)
@handle_route_errors("chat info", log_prefix="Chat")
async def chat_info(current_user: StudentUser) -> ChatInfoResponse:
    _ = current_user
    return success_response(ChatInfoData(**chat_service.get_api_info()))


@router.get("/health", response_model=ChatHealthResponse)
@handle_route_errors("chat health", log_prefix="Chat")
async def chat_health(current_user: StudentUser) -> ChatHealthResponse:
    _ = current_user
    payload = chat_service.get_health()
    return success_response(ChatHealthData(**payload))


@router.get("/questionnaire/flow")
@handle_route_errors("questionnaire flow", log_prefix="Chat")
async def questionnaire_flow(current_user: StudentUser) -> dict:
    _ = current_user
    return chat_service.get_questionnaire_flow()


@router.post("/questionnaire/evaluate")
@handle_route_errors("questionnaire evaluate", log_prefix="Chat")
async def questionnaire_evaluate(
    req: IntakeRequest,
    current_user: StudentUser,
) -> dict:
    _ = current_user
    return chat_service.evaluate_questionnaire(req)


@router.get("/patients", response_model=PatientListResponse)
@handle_route_errors("list adviser patients", log_prefix="Chat")
async def list_patients(current_user: StudentUser) -> PatientListResponse:
    result = await patient_service.list_patients(user_id=current_user.user_id)
    return success_response(PatientListData(**result))


@router.post("/patients", response_model=PatientDetailResponse)
@handle_route_errors("create adviser patient", log_prefix="Chat")
async def create_patient(
    req: CreatePatientRequest,
    current_user: StudentUser,
) -> PatientDetailResponse:
    result = await patient_service.create_patient(
        user_id=current_user.user_id,
        display_name=req.display_name,
    )
    return success_response(PatientDetail(**result))


@router.get("/patients/{patient_id}", response_model=PatientDetailResponse)
@handle_route_errors("get adviser patient", log_prefix="Chat")
async def get_patient(
    patient_id: str,
    current_user: StudentUser,
    include_messages: bool = Query(default=False),
    message_limit: int = Query(default=settings.chat_messages_page_size, ge=1, le=100),
) -> PatientDetailResponse:
    result = await patient_service.get_patient(
        user_id=current_user.user_id,
        patient_id=patient_id,
        include_messages=include_messages,
        message_limit=message_limit,
    )
    return success_response(PatientDetail(**result))


@router.get("/patients/{patient_id}/messages", response_model=PatientMessagesResponse)
@handle_route_errors("list patient messages", log_prefix="Chat")
async def get_patient_messages(
    patient_id: str,
    current_user: StudentUser,
    limit: int = Query(default=settings.chat_messages_page_size, ge=1, le=100),
    before: Optional[str] = Query(default=None),
) -> PatientMessagesResponse:
    result = await patient_service.get_patient_messages(
        user_id=current_user.user_id,
        patient_id=patient_id,
        limit=limit,
        before=before,
    )
    return success_response(PatientMessagesData(**result))


@router.put("/patients/{patient_id}/intake", response_model=PatientDetailResponse)
@handle_route_errors("save patient intake", log_prefix="Chat")
async def save_patient_intake(
    patient_id: str,
    req: SaveIntakeRequest,
    current_user: StudentUser,
) -> PatientDetailResponse:
    result = await patient_service.save_patient_intake(
        user_id=current_user.user_id,
        patient_id=patient_id,
        answers=req.answers,
        display_name=req.display_name,
    )
    return success_response(PatientDetail(**result))


@router.post("/patients/{patient_id}/recommend", response_model=PatientDetailResponse)
@handle_route_errors("recommend for patient", log_prefix="Chat")
async def recommend_for_patient(
    patient_id: str,
    current_user: StudentUser,
    top_k: Optional[int] = Query(default=None, ge=1, le=20),
) -> PatientDetailResponse:
    result = await chat_service.recommend_for_patient(
        user_id=current_user.user_id,
        patient_id=patient_id,
        top_k=top_k,
    )
    return success_response(PatientDetail(**result))


@router.post("/patients/{patient_id}/messages", response_model=PatientDetailResponse)
@handle_route_errors("send patient chat message", log_prefix="Chat")
async def send_patient_message(
    patient_id: str,
    req: SendMessageRequest,
    current_user: StudentUser,
) -> PatientDetailResponse:
    result = await chat_service.send_message_for_patient(
        user_id=current_user.user_id,
        patient_id=patient_id,
        question=req.question,
        top_k=req.top_k,
    )
    return success_response(PatientDetail(**result))
