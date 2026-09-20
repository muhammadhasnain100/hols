from pydantic import BaseModel

from models.common import ApiSuccessResponse


class HealthData(BaseModel):
    status: str
    message: str
    environment: str = "production"
    otp_required: bool = True
    payment_required: bool = True
    payment_gateway_bypass: bool = False


class TestData(BaseModel):
    success: bool
    data: str


HealthResponse = ApiSuccessResponse[HealthData]
TestResponse = ApiSuccessResponse[TestData]
