"""DynamoDB access + single-table provisioning for the HOLS backend.

The table (``settings.dynamodb_table``) holds every entity defined in
``database_entities.py`` using a generic PK/SK layout plus two GSIs:

    GSI1  -> email login / invite-code lookup / courses-by-section
    GSI2  -> affiliate reporting and the admin "all orders" feed

Run this module directly to create the table:

    python database.py
"""

from __future__ import annotations

import logging
from functools import lru_cache

import boto3
from botocore.exceptions import ClientError

from config import settings
from core.async_io import run_sync

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_dynamodb_resource():
    return boto3.resource(
        "dynamodb",
        region_name=settings.dynamodb_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )


def get_table():
    """Return the DynamoDB Table object for the HOLS single table."""
    return get_dynamodb_resource().Table(settings.dynamodb_table)


def table_exists(table_name: str) -> bool:
    client = get_dynamodb_resource().meta.client
    try:
        client.describe_table(TableName=table_name)
        return True
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ResourceNotFoundException":
            return False
        raise


def create_table(wait: bool = True):
    """Create the HOLS single table if it doesn't exist.

    Primary key:
        - PK (S)  : partition key   e.g. USER#<id>, COURSE#<id>, PLAN#<type>
        - SK (S)  : sort key        e.g. PROFILE, ORDER#<ts>#<id>, LESSON#...

    GSI1 (GSI1PK / GSI1SK):
        - EMAIL#<email>   -> user login
        - INVITE#<code>   -> resolve affiliate invite links
        - SECTION#<name>  -> list courses in a section

    GSI2 (GSI2PK / GSI2SK):
        - AFFILIATE#<id>  -> referred students + commissionable orders
        - ORDERS#<YYYY-MM> -> admin "all orders" feed by month
    """
    table_name = settings.dynamodb_table
    resource = get_dynamodb_resource()

    if table_exists(table_name):
        table = resource.Table(table_name)
        if wait:
            table.wait_until_exists()
        logger.info("DynamoDB table '%s' already exists", table_name)
        return table

    try:
        table = resource.create_table(
            TableName=table_name,
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
                {"AttributeName": "GSI1PK", "AttributeType": "S"},
                {"AttributeName": "GSI1SK", "AttributeType": "S"},
                {"AttributeName": "GSI2PK", "AttributeType": "S"},
                {"AttributeName": "GSI2SK", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "GSI1",
                    "KeySchema": [
                        {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                        {"AttributeName": "GSI1SK", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
                {
                    "IndexName": "GSI2",
                    "KeySchema": [
                        {"AttributeName": "GSI2PK", "KeyType": "HASH"},
                        {"AttributeName": "GSI2SK", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
            BillingMode="PAY_PER_REQUEST",
        )
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        if code not in ("ResourceInUseException",):
            raise
        table = resource.Table(table_name)

    if wait:
        table.wait_until_exists()
        logger.info("DynamoDB table '%s' is active (with GSI1, GSI2)", table_name)
    else:
        logger.info("DynamoDB table '%s' creation requested", table_name)

    return table


async def create_table_async(wait: bool = True):
    """Async wrapper for table provisioning at app startup."""
    return await run_sync(create_table, wait)


if __name__ == "__main__":
    from core.logging_config import setup_logging

    setup_logging(level=settings.log_level, log_format=settings.log_format)  # type: ignore[arg-type]
    create_table()
