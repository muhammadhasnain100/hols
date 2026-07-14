"""Application configuration loaded from the backend .env file."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ---- Database ----
    database_url: str = ""

    # ---- AWS Credentials (shared by S3, SES, DynamoDB, Bedrock) ----
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # ---- S3 Storage ----
    s3_region: str = "eu-north-1"
    s3_bucket_name: str = ""

    # ---- Email (Amazon SES) ----
    ses_region: str = "ap-southeast-2"
    ses_from: str = ""

    # ---- Bedrock (Clinic Onboarding Agent) ----
    bedrock_region: str = "us-east-1"
    bedrock_model_id: str = ""
    bedrock_api_key: str = ""

    # ---- DynamoDB ----
    dynamodb_region: str = "us-east-1"
    dynamodb_table: str = "hols-backend"

    # ---- Auth / JWT ----
    jwt_secret_key: str = "change-me"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # ---- OTP ----
    otp_required_after_seconds: int = 604800
    otp_expire_seconds: int = 600

    # ---- Logging ----
    log_level: str = "INFO"
    log_format: str = "plain"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance so the .env is parsed only once."""
    return Settings()


settings = get_settings()
