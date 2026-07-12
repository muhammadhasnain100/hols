"""DynamoDB access + table provisioning for the onboarding agent chat history.

Run this module directly to create the table:

    python database.py
"""

from __future__ import annotations

import boto3
from botocore.exceptions import ClientError

from config import settings


def get_dynamodb_resource():
    return boto3.resource(
        "dynamodb",
        region_name=settings.dynamodb_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )


def get_chat_table():
    """Return the DynamoDB Table object for the onboarding chat history."""
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


def create_chat_table(wait: bool = True):
    """Create the onboarding-agent chat history table if it doesn't exist.

    Schema:
        - session_id (S)  : partition key — one onboarding conversation
        - created_at (S)  : sort key — ISO timestamp of each message
    """
    table_name = settings.dynamodb_table

    if table_exists(table_name):
        print(f"Table '{table_name}' already exists — skipping creation.")
        return get_chat_table()

    resource = get_dynamodb_resource()
    table = resource.create_table(
        TableName=table_name,
        KeySchema=[
            {"AttributeName": "session_id", "KeyType": "HASH"},
            {"AttributeName": "created_at", "KeyType": "RANGE"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "session_id", "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "S"},
        ],
        BillingMode="PAY_PER_REQUEST",
    )

    if wait:
        table.wait_until_exists()
        print(f"Table '{table_name}' created and active.")
    else:
        print(f"Table '{table_name}' creation requested.")

    return table


if __name__ == "__main__":
    create_chat_table()
