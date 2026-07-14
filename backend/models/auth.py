"""API request/response schemas for authentication routes."""

from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, EmailStr, Field

from database_entities import UserRole
from models.common import ApiSuccessResponse


class AddressSchema(BaseModel):
    line1: str
    line2: Optional[str] = None
    city: str
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str


class StudentSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    marketing_pref: bool = False
    referred_by_affiliate_id: Optional[str] = None


class AdminCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    role: UserRole


class SendOtpRequest(BaseModel):
    otp_token: str


class VerifyOtpRequest(BaseModel):
    otp_token: str
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    address: Optional[AddressSchema] = None
    marketing_pref: Optional[bool] = None
    margin_percent: Optional[float] = None
    invite_code: Optional[str] = None
    role: Optional[UserRole] = None


class TokenData(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    otp_required: bool = False


class LoginOtpRequiredData(BaseModel):
    otp_required: bool = True
    otp_token: str
    message: str
    expires_in: int


class LoginSuccessData(TokenData):
    role: str
    user_id: str
    profile: dict[str, Any]


class SignupData(BaseModel):
    message: str = "Account created. Please log in."
    user_id: str
    profile: dict[str, Any]


class AdminCreateData(BaseModel):
    message: str = "Admin account created."
    user_id: str
    profile: dict[str, Any]


class OtpSentData(BaseModel):
    otp_token: str
    message: str
    expires_in: int


class ProfileData(BaseModel):
    profile: dict[str, Any]
    access: dict[str, Any]


class ProfileAccessMatrixData(BaseModel):
    requester_role: str
    endpoints: dict[str, dict[str, Any]]


# Standard wrapped API responses
SignupResponse = ApiSuccessResponse[SignupData]
AdminCreateResponse = ApiSuccessResponse[AdminCreateData]
LoginSuccessResponse = ApiSuccessResponse[LoginSuccessData]
LoginOtpRequiredResponse = ApiSuccessResponse[LoginOtpRequiredData]
LoginResponse = Union[LoginSuccessResponse, LoginOtpRequiredResponse]
OtpSentResponse = ApiSuccessResponse[OtpSentData]
TokenResponse = ApiSuccessResponse[TokenData]
ProfileResponse = ApiSuccessResponse[ProfileData]
ProfileAccessMatrixResponse = ApiSuccessResponse[ProfileAccessMatrixData]
