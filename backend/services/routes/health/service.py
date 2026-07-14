"""Health route service — liveness and test endpoints."""


def get_health() -> dict[str, str]:
    return {
        "status": "ok",
        "message": "HOLS API is running",
    }


def get_test() -> dict[str, str | bool]:
    return {
        "success": True,
        "data": "Backend test route is working",
    }
