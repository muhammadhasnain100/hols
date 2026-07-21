"""
upload_to_vectordb.py
---------------------
chunks.json ko ChromaDB Cloud pe upload karta hai.

- Local embedding model use karta hai (sentence-transformers/all-MiniLM-L6-v2, 384-dim).
- Batches me upload karta hai (Chroma Cloud ki request-size limit se bachne ke liye).
- Upsert use karta hai — dobara chalao to duplicates nahi banenge.

Chalao:
    python upload_to_vectordb.py
"""

import json
import os
import sys
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from tqdm import tqdm

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

load_dotenv(BACKEND_ROOT / ".env")

from services.routes.chat.chroma_client import get_chroma_client
from services.routes.chat.embed import build_embedding_function

CHUNKS_FILE = "chunks.json"
BATCH_SIZE = 128  # Chroma Cloud ke liye safe batch size (embeddings API ka rate-limit ke saath balance)

CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE = os.getenv("CHROMA_DATABASE", "ai_adviser")
COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "peptide_chunks")
EMBED_MODEL = os.getenv("EMBED_MODEL", "perplexity/pplx-embed-v1-4b")


def load_chunks(path: str) -> List[dict]:
    if not os.path.exists(path):
        print(f"'{path}' nahi mila. Pehle 'python prepare.py' chalao.")
        sys.exit(1)

    print(f"Loading '{path}' ...")
    with open(path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    if not isinstance(chunks, list) or not chunks:
        print("chunks.json empty ya invalid hai.")
        sys.exit(1)

    print(f"  Total chunks: {len(chunks)}")
    return chunks


def get_collection():
    if not (CHROMA_API_KEY and CHROMA_TENANT and CHROMA_DATABASE):
        print("Chroma creds missing. .env check karo.")
        sys.exit(1)

    print(f"Connecting to Chroma Cloud (tenant={CHROMA_TENANT[:8]}..., db={CHROMA_DATABASE}) ...")
    client = get_chroma_client()

    print(f"Using OpenRouter embedding model: {EMBED_MODEL}")
    embed_fn = build_embedding_function()

    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embed_fn,
        metadata={"hnsw:space": "cosine"},
    )
    print(f"Collection ready: '{COLLECTION_NAME}' (current count = {collection.count()})")
    return collection


def batched(iterable, n):
    for i in range(0, len(iterable), n):
        yield iterable[i:i + n]


def upload(collection, chunks: List[dict]):
    print(f"\nUploading {len(chunks)} chunks in batches of {BATCH_SIZE} ...")

    total_batches = (len(chunks) + BATCH_SIZE - 1) // BATCH_SIZE
    added = 0

    for batch in tqdm(list(batched(chunks, BATCH_SIZE)), total=total_batches, desc="Batches"):
        ids = [c["id"] for c in batch]
        docs = [c["text"] for c in batch]
        metas = [c.get("metadata", {}) for c in batch]

        try:
            collection.upsert(ids=ids, documents=docs, metadatas=metas)
            added += len(batch)
        except Exception as e:
            print(f"\n  Batch fail hua: {e}")
            print("  Aage badh raha hoon...")

    print(f"\nDone. Uploaded/updated ~{added} chunks.")
    print(f"Collection total now: {collection.count()}")


def main():
    chunks = load_chunks(CHUNKS_FILE)
    collection = get_collection()
    upload(collection, chunks)

    print("\nSample query test:")
    try:
        res = collection.query(
            query_texts=["best peptide for muscle recovery"],
            n_results=3,
        )
        for i, doc in enumerate(res["documents"][0]):
            meta = res["metadatas"][0][i]
            print(f"  [{i+1}] {meta.get('course_name', '?')}")
            print(f"      {doc[:120]}...")
    except Exception as e:
        print(f"  Query test fail: {e}")


if __name__ == "__main__":
    main()
