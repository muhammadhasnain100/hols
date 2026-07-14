"""Authentication routes — signup, login, OTP, tokens, profile."""

import json
from typing import Annotated, Any, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status

from core.route_handlers import handle_route_errors
from database_entities import UserRole
from dependencies import CurrentUser, get_current_user, require_roles
from models.auth import (
    AdminCreateData,
    AdminCreateRequest,
    AdminCreateResponse,
    LoginOtpRequiredData,
    LoginOtpRequiredResponse,
    LoginRequest,
    LoginResponse,
    LoginSuccessData,
    LoginSuccessResponse,
    OtpSentData,
    OtpSentResponse,
    ProfileAccessMatrixData,
    ProfileAccessMatrixResponse,
    ProfileData,
    ProfileResponse,
    ProfileUpdateRequest,
    RefreshTokenRequest,
    SendOtpRequest,
    SignupData,
    SignupResponse,
    StudentSignupRequest,
    TokenData,
    TokenResponse,
    VerifyOtpRequest,
)
from models.common import success_response
from services.routes.auth import service as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


async def _schedule_otp_email(background_tasks: BackgroundTasks, result: dict) -> dict:
    """Pop internal OTP email payload and send it in the background."""
    payload = result.pop("_otp_email", None)
    if payload:
        background_tasks.add_task(
            auth_service.send_otp_email,
            payload["user"],
            payload["code"],
        )
    return result


def _profile_form_updates(
    *,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    marketing_pref: Optional[bool] = None,
    address: Optional[str] = None,
    margin_percent: Optional[float] = None,
    invite_code: Optional[str] = None,
    role: Optional[str] = None,
) -> dict[str, Any]:
    updates: dict[str, Any] = {}
    if first_name is not None:
        updates["first_name"] = first_name
    if last_name is not None:
        updates["last_name"] = last_name
    if marketing_pref is not None:
        updates["marketing_pref"] = marketing_pref
    if margin_percent is not None:
        updates["margin_percent"] = margin_percent
    if invite_code is not None:
        updates["invite_code"] = invite_code
    if role is not None:
        updates["role"] = role
    if address:
        try:
            updates["address"] = json.loads(address)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "Invalid address JSON",
            ) from exc
    return updates


async def _apply_profile_pic_upload(
    *,
    user_id: str,
    profile_pic: Optional[UploadFile],
    updates: dict[str, Any],
    background_tasks: BackgroundTasks,
) -> None:
    if profile_pic is None or not profile_pic.filename:
        return

    content_type = profile_pic.content_type or "application/octet-stream"
    data = await profile_pic.read()
    auth_service.validate_profile_pic_file(content_type, data)
    key, public_url = auth_service.prepare_profile_pic_upload(user_id, profile_pic.filename)
    updates["profile_pic"] = public_url
    background_tasks.add_task(
        auth_service.upload_profile_pic_background,
        key,
        data,
        content_type,
    )


@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=status.HTTP_201_CREATED,
)
@handle_route_errors("register student account", log_prefix="Auth")
async def signup(body: StudentSignupRequest) -> SignupResponse:
    """Register a new student account."""
    profile = await auth_service.signup_student(
        email=str(body.email),
        password=body.password,
        first_name=body.first_name,
        last_name=body.last_name,
        marketing_pref=body.marketing_pref,
        referred_by_affiliate_id=body.referred_by_affiliate_id,
    )
    return success_response(
        SignupData(user_id=profile["user_id"], profile=profile),
    )


@router.post(
    "/create-admin",
    response_model=AdminCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
@handle_route_errors("create admin account", log_prefix="Auth")
async def create_admin(body: AdminCreateRequest) -> AdminCreateResponse:
    """Create a new admin account."""
    profile = await auth_service.create_admin(
        email=str(body.email),
        password=body.password,
        first_name=body.first_name,
        last_name=body.last_name,
    )
    return success_response(
        AdminCreateData(user_id=profile["user_id"], profile=profile),
    )


@router.post("/login", response_model=LoginResponse)
@handle_route_errors("login", log_prefix="Auth")
async def login(
    body: LoginRequest,
    background_tasks: BackgroundTasks,
) -> LoginSuccessResponse | LoginOtpRequiredResponse:
    """Login with email, password, and role."""
    result = await _schedule_otp_email(
        background_tasks,
        await auth_service.login(
            email=str(body.email),
            password=body.password,
            role=body.role,
        ),
    )
    if result.get("otp_required"):
        return success_response(LoginOtpRequiredData(**result))
    return success_response(LoginSuccessData(**result))


@router.post("/send-otp", response_model=OtpSentResponse)
@handle_route_errors("send OTP", log_prefix="Auth")
async def send_otp(
    body: SendOtpRequest,
    background_tasks: BackgroundTasks,
) -> OtpSentResponse:
    """Resend the login OTP using the ``otp_token`` from the login response."""
    result = await _schedule_otp_email(
        background_tasks,
        await auth_service.send_otp(body.otp_token),
    )
    return success_response(OtpSentData(**result))


@router.post("/verify-otp", response_model=LoginSuccessResponse)
@handle_route_errors("verify OTP", log_prefix="Auth")
async def verify_otp(body: VerifyOtpRequest) -> LoginSuccessResponse:
    """Verify the emailed OTP and receive access + refresh tokens."""
    result = await auth_service.verify_otp(body.otp_token, body.code)
    return success_response(LoginSuccessData(**result))


@router.post("/refresh", response_model=TokenResponse)
@handle_route_errors("refresh token", log_prefix="Auth")
async def refresh(body: RefreshTokenRequest) -> TokenResponse:
    """Exchange a valid refresh token for a new access + refresh token pair."""
    result = await auth_service.refresh_access_token(body.refresh_token)
    return success_response(TokenData(**result))


@router.get("/profile/access", response_model=ProfileAccessMatrixResponse)
@handle_route_errors("get profile access matrix", log_prefix="Auth")
async def get_profile_access(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ProfileAccessMatrixResponse:
    """Return which profile endpoints the current role is allowed to use."""
    return success_response(
        ProfileAccessMatrixData(**auth_service.get_profile_access_matrix(current_user.role)),
    )


@router.get("/profile", response_model=ProfileResponse)
@handle_route_errors("get own profile", log_prefix="Auth")
async def get_my_profile(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> ProfileResponse:
    """Get own profile."""
    result = await auth_service.get_profile(
        user_id=current_user.user_id,
        requester_id=current_user.user_id,
        requester_role=current_user.role,
        endpoint="GET /api/auth/profile",
    )
    return success_response(ProfileData(**result))


@router.get("/profile/{user_id}", response_model=ProfileResponse)
@handle_route_errors("get profile by id", log_prefix="Auth")
async def get_profile_by_id(
    user_id: str,
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles(UserRole.ADMIN)),
    ],
) -> ProfileResponse:
    """Get any user's profile by id. Admin only."""
    result = await auth_service.get_profile(
        user_id=user_id,
        requester_id=current_user.user_id,
        requester_role=current_user.role,
        endpoint="GET /api/auth/profile/{user_id}",
    )
    return success_response(ProfileData(**result))


@router.put("/profile", response_model=ProfileResponse)
@handle_route_errors("edit own profile", log_prefix="Auth")
async def edit_my_profile(
    background_tasks: BackgroundTasks,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    marketing_pref: Optional[bool] = Form(None),
    address: Optional[str] = Form(None),
    profile_pic: Optional[UploadFile] = File(None),
) -> ProfileResponse:
    """Edit own profile. Send multipart form-data; upload profile picture as a file."""
    updates = _profile_form_updates(
        first_name=first_name,
        last_name=last_name,
        marketing_pref=marketing_pref,
        address=address,
    )
    await _apply_profile_pic_upload(
        user_id=current_user.user_id,
        profile_pic=profile_pic,
        updates=updates,
        background_tasks=background_tasks,
    )
    result = await auth_service.edit_profile(
        user_id=current_user.user_id,
        requester_id=current_user.user_id,
        requester_role=current_user.role,
        updates=updates,
        endpoint="PUT /api/auth/profile",
    )
    return success_response(ProfileData(**result))


@router.put("/profile/{user_id}", response_model=ProfileResponse)
@handle_route_errors("edit profile by id", log_prefix="Auth")
async def edit_profile_by_id(
    user_id: str,
    body: ProfileUpdateRequest,
    current_user: Annotated[
        CurrentUser,
        Depends(require_roles(UserRole.ADMIN)),
    ],
) -> ProfileResponse:
    """Edit any user's profile by id. Admin only."""
    updates = body.model_dump(exclude_none=True)
    result = await auth_service.edit_profile(
        user_id=user_id,
        requester_id=current_user.user_id,
        requester_role=current_user.role,
        updates=updates,
        endpoint="PUT /api/auth/profile/{user_id}",
    )
    return success_response(ProfileData(**result))
