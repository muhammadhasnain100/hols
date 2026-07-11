from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    message: str


class TestResponse(BaseModel):
    success: bool
    data: str
