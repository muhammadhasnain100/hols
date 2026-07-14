from pydantic import BaseModel

from models.common import ApiSuccessResponse


class HealthData(BaseModel):
    status: str
    message: str


class TestData(BaseModel):
    success: bool
    data: str


HealthResponse = ApiSuccessResponse[HealthData]
TestResponse = ApiSuccessResponse[TestData]
