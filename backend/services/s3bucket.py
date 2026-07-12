"""S3 storage service — upload, download and manage objects in the bucket."""

from __future__ import annotations

import mimetypes
from datetime import datetime, timezone
from typing import BinaryIO

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from config import settings


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
