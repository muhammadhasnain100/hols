"""S3 storage service — upload, download and manage objects in the bucket."""

from __future__ import annotations

import logging
import mimetypes
from datetime import datetime, timezone
from functools import lru_cache
from typing import BinaryIO

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from config import settings
from core.async_io import run_sync

logger = logging.getLogger(__name__)

IMAGE_CONTENT_TYPES = frozenset(
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    }
)
PDF_CONTENT_TYPE = "application/pdf"


@lru_cache(maxsize=1)
def _client():
    return boto3.client(
        "s3",
        region_name=settings.s3_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        config=Config(signature_version="s3v4"),
    )


def upload_fileobj(
    fileobj: BinaryIO,
    key: str,
    content_type: str | None = None,
    bucket: str | None = None,
) -> str:
    """Upload a file-like object and return its S3 key."""
    bucket = bucket or settings.s3_bucket_name
    if content_type is None:
        content_type = mimetypes.guess_type(key)[0] or "application/octet-stream"

    _client().upload_fileobj(
        fileobj,
        bucket,
        key,
        ExtraArgs={"ContentType": content_type},
    )
    return key


def upload_bytes(
    data: bytes,
    key: str,
    content_type: str | None = None,
    bucket: str | None = None,
) -> str:
    """Upload raw bytes to the bucket and return the S3 key."""
    bucket = bucket or settings.s3_bucket_name
    if content_type is None:
        content_type = mimetypes.guess_type(key)[0] or "application/octet-stream"

    _client().put_object(
        Bucket=bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
    )
    return key


def upload_image(*, key: str, data: bytes, content_type: str | None = None) -> str:
    """Upload an image file to S3 using the provided object key."""
    resolved_type = content_type or mimetypes.guess_type(key)[0] or "application/octet-stream"
    if resolved_type not in IMAGE_CONTENT_TYPES:
        raise ValueError(
            f"Unsupported image content type: {resolved_type}. "
            f"Allowed: {', '.join(sorted(IMAGE_CONTENT_TYPES))}"
        )
    upload_bytes(data, key, content_type=resolved_type)
    logger.info("Uploaded image to s3://%s/%s", settings.s3_bucket_name, key)
    return key


async def upload_image_async(*, key: str, data: bytes, content_type: str | None = None) -> str:
    """Async wrapper for image upload."""
    return await run_sync(
        upload_image,
        key=key,
        data=data,
        content_type=content_type,
    )


def upload_pdf(*, key: str, data: bytes) -> str:
    """Upload a PDF file to S3 using the provided object key."""
    upload_bytes(data, key, content_type=PDF_CONTENT_TYPE)
    logger.info("Uploaded PDF to s3://%s/%s", settings.s3_bucket_name, key)
    return key


async def upload_pdf_async(*, key: str, data: bytes) -> str:
    """Async wrapper for PDF upload."""
    return await run_sync(upload_pdf, key=key, data=data)


def generate_presigned_upload_url(
    key: str,
    content_type: str = "application/octet-stream",
    expires_in: int = 3600,
    bucket: str | None = None,
) -> str:
    """Create a presigned URL a client can PUT a file to directly."""
    bucket = bucket or settings.s3_bucket_name
    return _client().generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=expires_in,
    )


def generate_presigned_download_url(
    key: str,
    expires_in: int = 3600,
    bucket: str | None = None,
) -> str:
    """Create a presigned URL to download/read a private object."""
    bucket = bucket or settings.s3_bucket_name
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expires_in,
    )


def public_url(key: str, bucket: str | None = None) -> str:
    """Return the public URL for an object (bucket must allow public reads)."""
    bucket = bucket or settings.s3_bucket_name
    return f"https://{bucket}.s3.{settings.s3_region}.amazonaws.com/{key}"


def delete_object(key: str, bucket: str | None = None) -> None:
    bucket = bucket or settings.s3_bucket_name
    _client().delete_object(Bucket=bucket, Key=key)


def object_exists(key: str, bucket: str | None = None) -> bool:
    bucket = bucket or settings.s3_bucket_name
    try:
        _client().head_object(Bucket=bucket, Key=key)
        return True
    except ClientError as exc:
        if exc.response["Error"]["Code"] in ("404", "NoSuchKey", "NotFound"):
            return False
        raise


def build_key(prefix: str, filename: str) -> str:
    """Build a timestamped, collision-resistant object key."""
    stamp = datetime.now(timezone.utc).strftime("%Y/%m/%d/%H%M%S%f")
    safe_name = filename.strip().replace(" ", "_")
    return f"{prefix.strip('/')}/{stamp}_{safe_name}"
