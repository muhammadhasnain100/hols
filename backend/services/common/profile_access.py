"""Role-based access rules for profile get/edit endpoints."""

from __future__ import annotations

from database_entities import UserRole

# Fields each role may update on their own profile.
SELF_EDITABLE_FIELDS: dict[str, set[str]] = {
    UserRole.STUDENT.value: {
        "first_name",
        "last_name",
        "profile_pic",
        "address",
        "marketing_pref",
    },
    UserRole.AFFILIATE.value: {
        "first_name",
        "last_name",
        "profile_pic",
        "address",
        "marketing_pref",
    },
    UserRole.ADMIN.value: {
        "first_name",
        "last_name",
        "profile_pic",
        "address",
        "marketing_pref",
    },
}

# Extra fields an admin may update on any user's profile.
ADMIN_EDITABLE_FIELDS: set[str] = {
    "margin_percent",
    "invite_code",
    "role",
}

# Profile fields visible in API responses per target role.
VISIBLE_PROFILE_FIELDS: dict[str, set[str]] = {
    UserRole.STUDENT.value: {
        "user_id",
        "role",
        "email",
        "first_name",
        "last_name",
        "profile_pic",
        "address",
        "marketing_pref",
        "referred_by_affiliate_id",
        "email_verified",
        "created_at",
    },
    UserRole.AFFILIATE.value: {
        "user_id",
        "role",
        "email",
        "first_name",
        "last_name",
        "profile_pic",
        "address",
        "marketing_pref",
        "margin_percent",
        "invite_code",
        "student_count",
        "email_verified",
        "created_at",
    },
    UserRole.ADMIN.value: {
        "user_id",
        "role",
        "email",
        "first_name",
        "last_name",
        "profile_pic",
        "address",
        "marketing_pref",
        "margin_percent",
        "invite_code",
        "student_count",
        "referred_by_affiliate_id",
        "email_verified",
        "last_login_at",
        "created_at",
    },
}

ENDPOINT_ACCESS: dict[str, dict[str, list[str]]] = {
    "GET /api/auth/profile": {
        "description": "Get authenticated user's own profile",
        "allowed_roles": [
            UserRole.STUDENT.value,
            UserRole.AFFILIATE.value,
            UserRole.ADMIN.value,
        ],
    },
    "PUT /api/auth/profile": {
        "description": "Edit authenticated user's own profile",
        "allowed_roles": [
            UserRole.STUDENT.value,
            UserRole.AFFILIATE.value,
            UserRole.ADMIN.value,
        ],
    },
    "GET /api/auth/profile/{user_id}": {
        "description": "Get any user's profile by id",
        "allowed_roles": [UserRole.ADMIN.value],
    },
    "PUT /api/auth/profile/{user_id}": {
        "description": "Edit any user's profile by id",
        "allowed_roles": [UserRole.ADMIN.value],
    },
}


def can_view_profile(requester_role: str, requester_id: str, target_user_id: str) -> bool:
    if requester_role == UserRole.ADMIN.value:
        return True
    return requester_id == target_user_id


def can_edit_profile(requester_role: str, requester_id: str, target_user_id: str) -> bool:
    if requester_role == UserRole.ADMIN.value:
        return True
    return requester_id == target_user_id


def editable_fields_for(requester_role: str, target_user_id: str, requester_id: str) -> set[str]:
    if requester_role == UserRole.ADMIN.value and target_user_id != requester_id:
        return (SELF_EDITABLE_FIELDS[UserRole.ADMIN.value] - {"profile_pic"}) | ADMIN_EDITABLE_FIELDS
    return SELF_EDITABLE_FIELDS.get(requester_role, set())


def filter_profile_for_view(profile: dict, target_role: str) -> dict:
    allowed = VISIBLE_PROFILE_FIELDS.get(target_role, VISIBLE_PROFILE_FIELDS[UserRole.STUDENT.value])
    return {key: value for key, value in profile.items() if key in allowed and value is not None}


def build_access_info(
    requester_role: str,
    requester_id: str,
    target_user_id: str,
    endpoint: str,
) -> dict:
    endpoint_meta = ENDPOINT_ACCESS.get(endpoint, {})
    return {
        "requester_role": requester_role,
        "target_user_id": target_user_id,
        "can_view": can_view_profile(requester_role, requester_id, target_user_id),
        "can_edit": can_edit_profile(requester_role, requester_id, target_user_id),
        "editable_fields": sorted(
            editable_fields_for(requester_role, target_user_id, requester_id)
        ),
        "endpoint": endpoint,
        "allowed_roles": endpoint_meta.get("allowed_roles", []),
    }
