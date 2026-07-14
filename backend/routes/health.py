from fastapi import APIRouter

from core.route_handlers import handle_route_errors
from models.common import success_response
from models.health import HealthData, HealthResponse, TestData, TestResponse
from services.routes.health import service as health_service

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
@handle_route_errors("health check", log_prefix="Health")
async def health_check() -> HealthResponse:
    return success_response(HealthData(**health_service.get_health()))


@router.get("/test", response_model=TestResponse)
@handle_route_errors("test endpoint", log_prefix="Health")
async def test_endpoint() -> TestResponse:
    return success_response(TestData(**health_service.get_test()))
