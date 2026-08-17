"""Single-table DynamoDB entity definitions for the HOLS backend.

All entities live in one table (``settings.dynamodb_table``) using a generic
``PK`` / ``SK`` layout plus two global secondary indexes:

    GSI1  -> lookups by email (login) and by affiliate invite code
    GSI2  -> affiliate reporting (referred students + commissionable orders)

Each entity is a Pydantic model with a ``to_item()`` method that returns the
exact dict to write to DynamoDB (keys + GSI attributes included), and the
class-level key builders describe how to read the item back.

Key patterns
------------
USER profile        PK=USER#<userId>        SK=PROFILE
OTP session         PK=USER#<userId>        SK=OTP#ACTIVE
Refresh token       PK=USER#<userId>        SK=REFRESH#<tokenId>
Payment method      PK=USER#<userId>        SK=PAYMENT#<paymentMethodId>
Membership (active) PK=USER#<userId>        SK=MEMBERSHIP#ACTIVE
Order               PK=USER#<userId>        SK=ORDER#<createdAt>#<orderId>
Plan (pricing)      PK=PLAN#<planType>      SK=PLAN
Course metadata     PK=COURSE#<courseId>    SK=METADATA
Course topic (L1)   PK=COURSE#<courseId>    SK=TOPIC#<order:03d>#<topicKey>
Course section (L2) PK=COURSE#<courseId>    SK=SECTION#<topicId>
Lesson / lecture    PK=COURSE#<courseId>    SK=LESSON#<order:05d>#<lessonId>
Lesson test result  PK=USER#<userId>        SK=TEST_RESULT#<courseId>#<lessonId>
Adviser patient     PK=USER#<userId>        SK=PATIENT#<patientId>
Adviser patient chat PK=USER#<userId>       SK=PATIENT#<patientId>#CHAT
Webinar             PK=WEBINAR#<id>         SK=METADATA
Webinar registration PK=USER#<userId>       SK=WEBINAR_REG#<webinarId>
Glossary term       PK=GLOSSARY             SK=TERM#<termId>
Dosing guide        PK=DOSING               SK=GUIDE#<guideId>
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, ClassVar, Optional

from pydantic import BaseModel, EmailStr, Field


# --------------------------------------------------------------------------- #
# Enums
# --------------------------------------------------------------------------- #
class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"
    AFFILIATE = "affiliate"


class PlanType(str, Enum):
    MONTHLY = "monthly"
    BIANNUAL = "biannual"
    ANNUAL = "annual"


# Tier ordering used for "does this plan unlock this course?" checks.
PLAN_DURATIONS: dict[str, int] = {
    PlanType.MONTHLY.value: 30,
    PlanType.BIANNUAL.value: 182,
    PlanType.ANNUAL.value: 365,
}

DEFAULT_PLAN_PRICES: dict[str, float] = {
    PlanType.MONTHLY.value: 29.99,
    PlanType.BIANNUAL.value: 149.99,
    PlanType.ANNUAL.value: 249.99,
}

PLAN_RANK: dict[str, int] = {
    PlanType.MONTHLY.value: 1,
    PlanType.BIANNUAL.value: 2,
    PlanType.ANNUAL.value: 3,
}


class MembershipStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class AdviserPatientStatus(str, Enum):
    DRAFT = "draft"
    RECOMMENDED = "recommended"
    CHATTING = "chatting"


class WebinarStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class WebinarRegistrationStatus(str, Enum):
    BOOKED = "booked"
    CANCELLED = "cancelled"


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _money(value: float | Decimal | None) -> Optional[Decimal]:
    """DynamoDB stores numbers as Decimal — never float."""
    if value is None:
        return None
    return Decimal(str(value))


class Address(BaseModel):
    line1: str
    line2: Optional[str] = None
    city: str
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str


# --------------------------------------------------------------------------- #
# Base entity
# --------------------------------------------------------------------------- #
class BaseEntity(BaseModel):
    """Common behaviour for every item written to the table."""

    def to_item(self) -> dict[str, Any]:
        raise NotImplementedError

    @staticmethod
    def _clean(item: dict[str, Any]) -> dict[str, Any]:
        """Drop None values (DynamoDB rejects them) and coerce enums / floats."""

        def _coerce(value: Any) -> Any:
            if value is None:
                return None
            if isinstance(value, Enum):
                return value.value
            if isinstance(value, BaseModel):
                return BaseEntity._clean(value.model_dump(exclude_none=True))
            if isinstance(value, float):
                return Decimal(str(value))
            if isinstance(value, dict):
                return {
                    key: coerced
                    for key, raw in value.items()
                    if (coerced := _coerce(raw)) is not None
                }
            if isinstance(value, list):
                return [_coerce(entry) for entry in value if entry is not None]
            return value

        cleaned: dict[str, Any] = {}
        for key, value in item.items():
            if value is None:
                continue
            cleaned[key] = _coerce(value)
        return cleaned


# --------------------------------------------------------------------------- #
# USER PROFILE
# --------------------------------------------------------------------------- #
class UserProfile(BaseEntity):
    user_id: str
    role: UserRole
    email: EmailStr
    first_name: str
    last_name: str
    profile_pic: Optional[str] = None  # S3 key / URL
    address: Optional[Address] = None
    marketing_pref: bool = False
    referred_by_affiliate_id: Optional[str] = None
    password_hash: Optional[str] = None
    last_login_at: Optional[str] = None
    email_verified: bool = False
    # Affiliate-only fields (admin-controlled)
    margin_percent: Optional[float] = None
    invite_code: Optional[str] = None
    invitation_quota: Optional[int] = None
    student_count: int = 0
    created_at: str = Field(default_factory=now_iso)

    ENTITY: ClassVar[str] = "USER"

    @staticmethod
    def pk(user_id: str) -> str:
        return f"USER#{user_id}"

    @staticmethod
    def sk() -> str:
        return "PROFILE"

    def to_item(self) -> dict[str, Any]:
        item: dict[str, Any] = {
            "PK": self.pk(self.user_id),
            "SK": self.sk(),
            "entity": self.ENTITY,
            "user_id": self.user_id,
            "role": self.role,
            "email": str(self.email),
            "first_name": self.first_name,
            "last_name": self.last_name,
            "profile_pic": self.profile_pic,
            "address": self.address,
            "marketing_pref": self.marketing_pref,
            "referred_by_affiliate_id": self.referred_by_affiliate_id,
            "password_hash": self.password_hash,
            "last_login_at": self.last_login_at,
            "email_verified": self.email_verified,
            "margin_percent": _money(self.margin_percent),
            "invite_code": self.invite_code,
            "invitation_quota": self.invitation_quota if self.role == UserRole.AFFILIATE else None,
            "student_count": self.student_count if self.role == UserRole.AFFILIATE else None,
            "created_at": self.created_at,
            # GSI1: email login (or invite-code lookup for affiliates)
            "GSI1PK": f"EMAIL#{str(self.email).lower()}",
            "GSI1SK": "USER",
        }
        # Students referred by an affiliate are indexed for affiliate reports.
        if self.referred_by_affiliate_id:
            item["GSI2PK"] = f"AFFILIATE#{self.referred_by_affiliate_id}"
            item["GSI2SK"] = f"USER#{self.user_id}"
        elif self.role == UserRole.AFFILIATE:
            item["GSI2PK"] = f"ROLE#{self.role.value}"
            item["GSI2SK"] = f"USER#{self.created_at}#{self.user_id}"
        return self._clean(item)


# --------------------------------------------------------------------------- #
# OTP SESSION  (login verification)
# --------------------------------------------------------------------------- #
class OtpSession(BaseEntity):
    user_id: str
    otp_hash: str
    expires_at: str
    purpose: str = "login"
    created_at: str = Field(default_factory=now_iso)

    ENTITY: ClassVar[str] = "OTP"

    @staticmethod
    def pk(user_id: str) -> str:
        return f"USER#{user_id}"

    @staticmethod
    def sk() -> str:
        return "OTP#ACTIVE"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.user_id),
                "SK": self.sk(),
                "entity": self.ENTITY,
                "user_id": self.user_id,
                "otp_hash": self.otp_hash,
                "expires_at": self.expires_at,
                "purpose": self.purpose,
                "created_at": self.created_at,
            }
        )


# --------------------------------------------------------------------------- #
# REFRESH TOKEN
# --------------------------------------------------------------------------- #
class RefreshTokenRecord(BaseEntity):
    user_id: str
    token_id: str
    token_hash: str
    expires_at: str
    created_at: str = Field(default_factory=now_iso)

    ENTITY: ClassVar[str] = "REFRESH_TOKEN"

    @staticmethod
    def pk(user_id: str) -> str:
        return f"USER#{user_id}"

    @staticmethod
    def sk(token_id: str) -> str:
        return f"REFRESH#{token_id}"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.user_id),
                "SK": self.sk(self.token_id),
                "entity": self.ENTITY,
                "user_id": self.user_id,
                "token_id": self.token_id,
                "token_hash": self.token_hash,
                "expires_at": self.expires_at,
                "created_at": self.created_at,
            }
        )


# --------------------------------------------------------------------------- #
# PAYMENT METHOD  (separate collection — no card data on the profile)
# --------------------------------------------------------------------------- #
class PaymentMethod(BaseEntity):
    user_id: str
    payment_method_id: str
    provider: str = "internal"
    card_holder_name: Optional[str] = None
    card_last4: Optional[str] = None
    card_number_encrypted: Optional[str] = None
    exp_month: Optional[int] = None
    exp_year: Optional[int] = None
    cvc_encrypted: Optional[str] = None
    pin_encrypted: Optional[str] = None
    brand: Optional[str] = None
    is_default: bool = False
    billing_address: Optional[Address] = None
    created_at: str = Field(default_factory=now_iso)

    ENTITY: ClassVar[str] = "PAYMENT_METHOD"

    @staticmethod
    def pk(user_id: str) -> str:
        return f"USER#{user_id}"

    @staticmethod
    def sk(payment_method_id: str) -> str:
        return f"PAYMENT#{payment_method_id}"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.user_id),
                "SK": self.sk(self.payment_method_id),
                "entity": self.ENTITY,
                "payment_method_id": self.payment_method_id,
                "provider": self.provider,
                "card_holder_name": self.card_holder_name,
                "card_last4": self.card_last4,
                "card_number_encrypted": self.card_number_encrypted,
                "exp_month": self.exp_month,
                "exp_year": self.exp_year,
                "cvc_encrypted": self.cvc_encrypted,
                "pin_encrypted": self.pin_encrypted,
                "brand": self.brand,
                "is_default": self.is_default,
                "billing_address": self.billing_address,
                "created_at": self.created_at,
            }
        )


# --------------------------------------------------------------------------- #
# MEMBERSHIP  (student's current active plan — singleton per user)
# --------------------------------------------------------------------------- #
class Membership(BaseEntity):
    user_id: str
    plan_type: PlanType
    status: MembershipStatus = MembershipStatus.ACTIVE
    start_date: str = Field(default_factory=now_iso)
    end_date: str = ""
    order_id: Optional[str] = None

    ENTITY: ClassVar[str] = "MEMBERSHIP"

    @staticmethod
    def pk(user_id: str) -> str:
        return f"USER#{user_id}"

    @staticmethod
    def sk() -> str:
        return "MEMBERSHIP#ACTIVE"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.user_id),
                "SK": self.sk(),
                "entity": self.ENTITY,
                "plan_type": self.plan_type,
                "status": self.status,
                "start_date": self.start_date,
                "end_date": self.end_date,
                "order_id": self.order_id,
            }
        )


# --------------------------------------------------------------------------- #
# ORDER / PAYMENT
# --------------------------------------------------------------------------- #
class Order(BaseEntity):
    user_id: str
    order_id: str
    plan_type: PlanType
    amount: float | Decimal
    currency: str = "USD"
    status: OrderStatus = OrderStatus.PENDING
    payment_method_id: Optional[str] = None
    affiliate_id: Optional[str] = None
    affiliate_commission: Optional[float | Decimal] = None
    created_at: str = Field(default_factory=now_iso)

    ENTITY: ClassVar[str] = "ORDER"

    @staticmethod
    def pk(user_id: str) -> str:
        return f"USER#{user_id}"

    @staticmethod
    def sk(created_at: str, order_id: str) -> str:
        return f"ORDER#{created_at}#{order_id}"

    def to_item(self) -> dict[str, Any]:
        item: dict[str, Any] = {
            "PK": self.pk(self.user_id),
            "SK": self.sk(self.created_at, self.order_id),
            "entity": self.ENTITY,
            "order_id": self.order_id,
            "plan_type": self.plan_type,
            "amount": _money(self.amount),
            "currency": self.currency,
            "status": self.status,
            "payment_method_id": self.payment_method_id,
            "affiliate_id": self.affiliate_id,
            "affiliate_commission": _money(self.affiliate_commission),
            "created_at": self.created_at,
            # Admin "all orders" feed, bucketed by month.
            "GSI2PK": f"ORDERS#{self.created_at[:7]}",
            "GSI2SK": f"ORDER#{self.created_at}#{self.order_id}",
        }
        # Commissionable orders are also indexed under the affiliate.
        if self.affiliate_id:
            item["GSI2PK"] = f"AFFILIATE#{self.affiliate_id}"
        return self._clean(item)


# --------------------------------------------------------------------------- #
# PLAN  (pricing — admin editable)
# --------------------------------------------------------------------------- #
class Plan(BaseEntity):
    plan_type: PlanType
    price: float | Decimal
    currency: str = "USD"
    duration_days: int
    updated_by: Optional[str] = None  # admin user_id
    updated_at: str = Field(default_factory=now_iso)

    ENTITY: ClassVar[str] = "PLAN"

    @staticmethod
    def pk(plan_type: str) -> str:
        return f"PLAN#{plan_type}"

    @staticmethod
    def sk() -> str:
        return "PLAN"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.plan_type.value),
                "SK": self.sk(),
                "entity": self.ENTITY,
                "plan_type": self.plan_type,
                "price": _money(self.price),
                "currency": self.currency,
                "duration_days": self.duration_days,
                "updated_by": self.updated_by,
                "updated_at": self.updated_at,
            }
        )


# --------------------------------------------------------------------------- #
# COURSE + LESSON (lectures from courses_complete.json)
# --------------------------------------------------------------------------- #
class Course(BaseEntity):
    course_id: str
    title: str
    section: str
    description: Optional[str] = None
    required_plan: PlanType = PlanType.MONTHLY
    created_by: Optional[str] = None  # admin user_id
    created_at: str = Field(default_factory=now_iso)
    topic_count: Optional[int] = None
    section_count: Optional[int] = None
    lesson_count: Optional[int] = None

    ENTITY: ClassVar[str] = "COURSE"

    @staticmethod
    def pk(course_id: str) -> str:
        return f"COURSE#{course_id}"

    @staticmethod
    def sk() -> str:
        return "METADATA"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.course_id),
                "SK": self.sk(),
                "entity": self.ENTITY,
                "course_id": self.course_id,
                "title": self.title,
                "section": self.section,
                "description": self.description,
                "required_plan": self.required_plan,
                "created_by": self.created_by,
                "created_at": self.created_at,
                "topic_count": self.topic_count,
                "section_count": self.section_count,
                "lesson_count": self.lesson_count,
                # List courses by section.
                "GSI1PK": f"SECTION#{self.section}",
                "GSI1SK": f"COURSE#{self.course_id}",
            }
        )


class CourseTopic(BaseEntity):
    """L1 topic under a course (``topics[].l1_name``)."""

    course_id: str
    topic_key: str
    l1_name: str
    order: int
    section_count: int = 0
    lesson_count: int = 0

    ENTITY: ClassVar[str] = "COURSE_TOPIC"

    @staticmethod
    def pk(course_id: str) -> str:
        return f"COURSE#{course_id}"

    @staticmethod
    def sk(order: int, topic_key: str) -> str:
        return f"TOPIC#{order:03d}#{topic_key}"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.course_id),
                "SK": self.sk(self.order, self.topic_key),
                "entity": self.ENTITY,
                "course_id": self.course_id,
                "topic_key": self.topic_key,
                "l1_name": self.l1_name,
                "order": self.order,
                "section_count": self.section_count,
                "lesson_count": self.lesson_count,
            }
        )


class CourseSection(BaseEntity):
    """L2 section under a course (``topics[].sections[]``)."""

    course_id: str
    topic_id: str
    l1_name: str
    l2_name: str
    order: int
    item_count: int = 0
    l1_order: int = 0

    ENTITY: ClassVar[str] = "COURSE_SECTION"

    @staticmethod
    def pk(course_id: str) -> str:
        return f"COURSE#{course_id}"

    @staticmethod
    def sk(topic_id: str) -> str:
        return f"SECTION#{topic_id}"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.course_id),
                "SK": self.sk(self.topic_id),
                "entity": self.ENTITY,
                "course_id": self.course_id,
                "topic_id": self.topic_id,
                "l1_name": self.l1_name,
                "l2_name": self.l2_name,
                "order": self.order,
                "item_count": self.item_count,
                "l1_order": self.l1_order,
            }
        )


class Lesson(BaseEntity):
    """Lecture / lesson item — maps JSON ``lessons[]`` under a section."""

    course_id: str
    lesson_id: str
    title: str
    order: int
    fact: Optional[str] = None
    study_bullets: Optional[str] = None
    supporting_content: Optional[str] = None
    variants: Optional[list[dict[str, Any]]] = None
    topic_id: Optional[str] = None
    l1_name: Optional[str] = None
    l2_name: Optional[str] = None
    l1_order: Optional[int] = None
    l2_order: Optional[int] = None
    text_content: Optional[str] = None
    raw_data_s3_key: Optional[str] = None  # raw file stored in S3

    ENTITY: ClassVar[str] = "LESSON"

    @staticmethod
    def pk(course_id: str) -> str:
        return f"COURSE#{course_id}"

    @staticmethod
    def sk(order: int, lesson_id: str) -> str:
        # :05d — some courses have 1000+ lessons.
        return f"LESSON#{order:05d}#{lesson_id}"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.course_id),
                "SK": self.sk(self.order, self.lesson_id),
                "entity": self.ENTITY,
                "course_id": self.course_id,
                "lesson_id": self.lesson_id,
                "title": self.title,
                "order": self.order,
                "fact": self.fact,
                "study_bullets": self.study_bullets,
                "supporting_content": self.supporting_content,
                "variants": self.variants,
                "topic_id": self.topic_id,
                "l1_name": self.l1_name,
                "l2_name": self.l2_name,
                "l1_order": self.l1_order,
                "l2_order": self.l2_order,
                "text_content": self.text_content,
                "raw_data_s3_key": self.raw_data_s3_key,
            }
        )


# --------------------------------------------------------------------------- #
# GLOSSARY + DOSING GUIDE  (admin content)
# --------------------------------------------------------------------------- #
class GlossaryTerm(BaseEntity):
    term_id: str
    term: str
    definition: str
    created_by: Optional[str] = None
    updated_at: str = Field(default_factory=now_iso)

    ENTITY: ClassVar[str] = "GLOSSARY_TERM"

    @staticmethod
    def pk() -> str:
        return "GLOSSARY"

    @staticmethod
    def sk(term_id: str) -> str:
        return f"TERM#{term_id}"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(),
                "SK": self.sk(self.term_id),
                "entity": self.ENTITY,
                "term_id": self.term_id,
                "term": self.term,
                "definition": self.definition,
                "created_by": self.created_by,
                "updated_at": self.updated_at,
            }
        )


class DosingGuide(BaseEntity):
    guide_id: str
    title: str
    content: str
    created_by: Optional[str] = None
    updated_at: str = Field(default_factory=now_iso)

    ENTITY: ClassVar[str] = "DOSING_GUIDE"

    @staticmethod
    def pk() -> str:
        return "DOSING"

    @staticmethod
    def sk(guide_id: str) -> str:
        return f"GUIDE#{guide_id}"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(),
                "SK": self.sk(self.guide_id),
                "entity": self.ENTITY,
                "guide_id": self.guide_id,
                "title": self.title,
                "content": self.content,
                "created_by": self.created_by,
                "updated_at": self.updated_at,
            }
        )


# --------------------------------------------------------------------------- #
# LESSON TEST RESULT  (student quiz attempts)
# --------------------------------------------------------------------------- #
class LessonTestResult(BaseEntity):
    """Latest scored quiz attempt for one lesson by one student."""

    user_id: str
    course_id: str
    lesson_id: str
    lesson_title: str
    lesson_order: int = 0
    attempt_id: str
    total_questions: int
    correct_count: int
    score_percent: float
    passed: bool
    answers: list[dict[str, Any]] = Field(default_factory=list)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

    ENTITY: ClassVar[str] = "LESSON_TEST_RESULT"

    @staticmethod
    def pk(user_id: str) -> str:
        return f"USER#{user_id}"

    @staticmethod
    def sk(course_id: str, lesson_id: str) -> str:
        return f"TEST_RESULT#{course_id}#{lesson_id}"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.user_id),
                "SK": self.sk(self.course_id, self.lesson_id),
                "entity": self.ENTITY,
                "user_id": self.user_id,
                "course_id": self.course_id,
                "lesson_id": self.lesson_id,
                "lesson_title": self.lesson_title,
                "lesson_order": self.lesson_order,
                "attempt_id": self.attempt_id,
                "total_questions": self.total_questions,
                "correct_count": self.correct_count,
                "score_percent": self.score_percent,
                "passed": self.passed,
                "answers": self.answers,
                "created_at": self.created_at,
                "updated_at": self.updated_at,
            }
        )


# --------------------------------------------------------------------------- #
# ADVISER PATIENT + CHAT  (student peptide adviser cases)
# --------------------------------------------------------------------------- #
class AdviserPatient(BaseEntity):
    """One clinical patient case owned by a student user."""

    user_id: str
    patient_id: str
    display_name: str
    status: AdviserPatientStatus = AdviserPatientStatus.DRAFT
    intake_answers: dict[str, Any] = Field(default_factory=dict)
    evaluation: Optional[dict[str, Any]] = None
    recommendation: Optional[str] = None
    sources: list[dict[str, Any]] = Field(default_factory=list)
    primary_goal: Optional[str] = None
    message_count: int = 0
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

    ENTITY: ClassVar[str] = "ADVISER_PATIENT"

    @staticmethod
    def pk(user_id: str) -> str:
        return f"USER#{user_id}"

    @staticmethod
    def sk(patient_id: str) -> str:
        return f"PATIENT#{patient_id}"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.user_id),
                "SK": self.sk(self.patient_id),
                "entity": self.ENTITY,
                "user_id": self.user_id,
                "patient_id": self.patient_id,
                "display_name": self.display_name,
                "status": self.status,
                "intake_answers": self.intake_answers,
                "evaluation": self.evaluation,
                "recommendation": self.recommendation,
                "sources": self.sources,
                "primary_goal": self.primary_goal,
                "message_count": self.message_count,
                "created_at": self.created_at,
                "updated_at": self.updated_at,
            }
        )


class AdviserPatientChat(BaseEntity):
    """Singleton chat thread for one adviser patient case."""

    user_id: str
    patient_id: str
    messages: list[dict[str, Any]] = Field(default_factory=list)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

    ENTITY: ClassVar[str] = "ADVISER_PATIENT_CHAT"

    @staticmethod
    def pk(user_id: str) -> str:
        return f"USER#{user_id}"

    @staticmethod
    def sk(patient_id: str) -> str:
        return f"PATIENT#{patient_id}#CHAT"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.user_id),
                "SK": self.sk(self.patient_id),
                "entity": self.ENTITY,
                "user_id": self.user_id,
                "patient_id": self.patient_id,
                "messages": self.messages,
                "created_at": self.created_at,
                "updated_at": self.updated_at,
            }
        )


def plan_unlocks(student_plan: str, required_plan: str) -> bool:
    """True if a student's plan tier is >= the course's required plan."""
    return PLAN_RANK.get(student_plan, 0) >= PLAN_RANK.get(required_plan, 0)


# --------------------------------------------------------------------------- #
# WEBINAR
# --------------------------------------------------------------------------- #
class Webinar(BaseEntity):
    webinar_id: str
    title: str
    description: Optional[str] = None
    starts_at: str
    ends_at: Optional[str] = None
    price: float | Decimal = 0
    currency: str = "USD"
    capacity: int = 100
    seats_taken: int = 0
    join_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: WebinarStatus = WebinarStatus.DRAFT
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

    ENTITY: ClassVar[str] = "WEBINAR"

    @staticmethod
    def pk(webinar_id: str) -> str:
        return f"WEBINAR#{webinar_id}"

    @staticmethod
    def sk() -> str:
        return "METADATA"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.webinar_id),
                "SK": self.sk(),
                "entity": self.ENTITY,
                "webinar_id": self.webinar_id,
                "title": self.title,
                "description": self.description,
                "starts_at": self.starts_at,
                "ends_at": self.ends_at,
                "price": _money(self.price),
                "currency": self.currency,
                "capacity": self.capacity,
                "seats_taken": self.seats_taken,
                "join_url": self.join_url,
                "thumbnail_url": self.thumbnail_url,
                "status": self.status,
                "created_by": self.created_by,
                "created_at": self.created_at,
                "updated_at": self.updated_at,
                # Catalog feed for published + draft admin listings
                "GSI1PK": "SECTION#webinars",
                "GSI1SK": f"START#{self.starts_at}#{self.webinar_id}",
            }
        )


class WebinarRegistration(BaseEntity):
    user_id: str
    webinar_id: str
    order_id: Optional[str] = None
    amount: float | Decimal = 0
    currency: str = "USD"
    status: WebinarRegistrationStatus = WebinarRegistrationStatus.BOOKED
    payment_method_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)

    ENTITY: ClassVar[str] = "WEBINAR_REGISTRATION"

    @staticmethod
    def pk(user_id: str) -> str:
        return f"USER#{user_id}"

    @staticmethod
    def sk(webinar_id: str) -> str:
        return f"WEBINAR_REG#{webinar_id}"

    def to_item(self) -> dict[str, Any]:
        return self._clean(
            {
                "PK": self.pk(self.user_id),
                "SK": self.sk(self.webinar_id),
                "entity": self.ENTITY,
                "user_id": self.user_id,
                "webinar_id": self.webinar_id,
                "order_id": self.order_id,
                "amount": _money(self.amount),
                "currency": self.currency,
                "status": self.status,
                "payment_method_id": self.payment_method_id,
                "created_at": self.created_at,
                "GSI1PK": f"WEBINAR#{self.webinar_id}",
                "GSI1SK": f"REG#{self.created_at}#{self.user_id}",
            }
        )
