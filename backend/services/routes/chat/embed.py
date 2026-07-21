"""
embed.py
--------
Shared Chroma-compatible embedding function that calls OpenRouter's
/embeddings endpoint (OpenAI-compatible).

Default model: perplexity/pplx-embed-v1-4b  (2560 dims, 32K context)
"""

import time
from typing import List

from chromadb import Documents, EmbeddingFunction, Embeddings
from openai import OpenAI

from config import settings


class OpenRouterEmbeddingFunction(EmbeddingFunction[Documents]):
    """
    Chroma-compatible embedding function using OpenRouter.

    Batches inputs to avoid request-size limits and retries on transient errors.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "perplexity/pplx-embed-v1-4b",
        base_url: str = "https://openrouter.ai/api/v1",
        batch_size: int = 32,
        max_retries: int = 4,
    ):
        if not api_key:
            raise ValueError("OpenRouter API key missing.")
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self.batch_size = batch_size
        self.max_retries = max_retries

    def _embed_batch(self, batch: List[str]) -> List[List[float]]:
        # Chroma sometimes passes empty strings; embeddings API rejects them.
        safe_batch = [t if (t and t.strip()) else " " for t in batch]

        delay = 1.0
        last_err: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = self.client.embeddings.create(
                    model=self.model,
                    input=safe_batch,
                )
                return [item.embedding for item in resp.data]
            except Exception as e:  # noqa: BLE001
                last_err = e
                if attempt == self.max_retries:
                    break
                time.sleep(delay)
                delay = min(delay * 2, 10.0)

        raise RuntimeError(f"Embedding batch failed after {self.max_retries} retries: {last_err}")

    def __call__(self, input: Documents) -> Embeddings:
        texts: List[str] = list(input)
        embeddings: List[List[float]] = []
        for i in range(0, len(texts), self.batch_size):
            embeddings.extend(self._embed_batch(texts[i:i + self.batch_size]))
        return embeddings

    # Chroma introspection — helps make a consistent collection id.
    @staticmethod
    def name() -> str:
        return "openrouter"


def build_embedding_function() -> OpenRouterEmbeddingFunction:
    """Factory that reads settings and returns a ready-to-use embed fn."""
    return OpenRouterEmbeddingFunction(
        api_key=settings.openrouter_api_key,
        model=settings.embed_model,
        base_url=settings.openrouter_base_url,
        batch_size=settings.embed_batch_size,
    )
