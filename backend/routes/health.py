from fastapi import APIRouter

from models import HealthResponse, TestResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", message="HOLS API is running")


@router.get("/test", response_model=TestResponse)
def test_endpoint() -> TestResponse:
    return TestResponse(success=True, data="Backend test route is working")
