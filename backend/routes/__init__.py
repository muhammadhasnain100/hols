from routes.authroute import router as auth_router
from routes.health import router as health_router
from routes.lectureroute import router as lectures_router
from routes.paymentroute import router as payment_router
from routes.usersroute import router as users_router

__all__ = [
    "auth_router",
    "health_router",
    "lectures_router",
    "payment_router",
    "users_router",
]