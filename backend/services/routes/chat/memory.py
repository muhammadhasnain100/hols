"""LangChain ConversationTokenBufferMemory for adviser follow-up chat."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from functools import lru_cache
from typing import Iterable

from langchain_classic.memory import ConversationTokenBufferMemory
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_openai import ChatOpenAI

from config import settings
from models.chat import ChatMessage

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class MemoryTrimStats:
    total_messages: int
    trimmed_messages: int
    max_token_limit: int


@lru_cache(maxsize=1)
def _token_counter_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.chat_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        temperature=0,
    )


def build_conversation_memory() -> ConversationTokenBufferMemory:
    return ConversationTokenBufferMemory(
        llm=_token_counter_llm(),
        max_token_limit=settings.chat_memory_max_tokens,
        return_messages=True,
    )


def trim_chat_history(messages: Iterable[dict]) -> tuple[list[ChatMessage], MemoryTrimStats]:
    """Load stored messages into token buffer memory and return the trimmed history."""
    stored = [
        message
        for message in messages
        if message.get("role") in {"user", "assistant"} and message.get("content")
    ]
    memory = build_conversation_memory()

    for message in stored:
        role = message.get("role")
        content = str(message.get("content"))
        if role == "user":
            memory.chat_memory.add_user_message(content)
        else:
            memory.chat_memory.add_ai_message(content)

    history = memory.load_memory_variables({}).get("history") or []
    trimmed: list[ChatMessage] = []
    for item in history:
        if isinstance(item, HumanMessage):
            trimmed.append(ChatMessage(role="user", content=str(item.content)))
        elif isinstance(item, AIMessage):
            trimmed.append(ChatMessage(role="assistant", content=str(item.content)))
        elif isinstance(item, BaseMessage):
            role = "user" if item.type == "human" else "assistant"
            trimmed.append(ChatMessage(role=role, content=str(item.content)))

    stats = MemoryTrimStats(
        total_messages=len(stored),
        trimmed_messages=len(trimmed),
        max_token_limit=settings.chat_memory_max_tokens,
    )
    logger.info(
        "Chat memory trim: total=%d trimmed=%d max_tokens=%d",
        stats.total_messages,
        stats.trimmed_messages,
        stats.max_token_limit,
    )
    if stats.total_messages > stats.trimmed_messages:
        logger.info(
            "Chat memory dropped %d older message(s) to stay within token limit",
            stats.total_messages - stats.trimmed_messages,
        )

    return trimmed, stats
