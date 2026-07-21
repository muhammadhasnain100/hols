"""Peptide adviser chat — intake questionnaire, RAG recommendations, and follow-up."""

from __future__ import annotations

import json
import logging
import threading
import time
from typing import List, Optional

from fastapi import HTTPException
from openai import OpenAI

from config import settings
from config import settings
from models.chat import ChatMessage, FollowUpRequest, IntakeRequest, Source
from services.routes.chat.chroma_client import get_chroma_client
from services.routes.chat.embed import build_embedding_function
from services.routes.chat.memory import trim_chat_history
from services.routes.chat.questionnaire import (
    build_rag_query,
    evaluate_intake,
    get_flow_definition,
)

logger = logging.getLogger(__name__)

INTAKE_SYSTEM = """You are Frontier BioMed's provider-facing Peptide Recommendation assistant.

Address the provider as Dr. Sarah Mitchell when appropriate. The output is a formal Recommendation Card for their clinical records.

You receive:
1) Structured patient intake answers (snapshot, safety gate, goal branch, preferences)
2) A deterministic evaluation (ranked peptides, safety flags, labs, stacks)
3) Retrieved knowledge-base context for candidate peptides

Produce a **Recommendation Card** in markdown with these sections (use ### headings):

### Ranked shortlist
2–4 peptides for the primary goal. For each: name, evidence tier, brief fit rationale,
and which intake answers drove the suggestion (reasoning trace).

### Suggested stack (if applicable)
Only when evaluation includes stacks or secondary goal — name validated combos.

### Safety flags
List hard blocks, cautions, and monitoring notes from the evaluation (e.g. IGF-1 baseline,
BP check for PT-141). Do not override non-overridable blocks.

### Recommended baseline labs
Bullet list from evaluation before initiation.

### Regulatory note
One sentence: recommendations support clinical judgment only; verify current 503A/status
with Frontier BioMed before finalizing.

RULES:
- Never prescribe doses or instruct the provider to start therapy.
- Honor blocked/excluded peptides — do not recommend them.
- Prefer evaluation rankings; use KB context for mechanism, cautions, and evidence detail.
- Be concise, professional, provider-facing tone.
- End with italic disclaimer from evaluation.
"""

FOLLOWUP_SYSTEM = """You are Frontier BioMed's provider-facing Peptide Adviser in a live consultation chat AFTER the Recommendation Card was delivered.

Address the registered practitioner as Dr. Sarah Mitchell, MD professionally.

The licensed provider may ask clarifying questions about:
- The ranked peptides, evidence, mechanisms, side effects, storage, handling
- Safety flags, labs, stacks from the intake
- "What if…" scenarios related to this patient's answers
- Comparisons between suggested peptides

You receive: patient intake answers, deterministic evaluation, the recommendation card already shown, retrieved knowledge-base context, and chat history.

RULES:
- Stay on this patient case and peptide/clinical-education topics only.
- Be conversational and concise (WhatsApp-style) — short paragraphs, bullets when helpful.
- Never prescribe doses or instruct the provider to start therapy.
- Honor safety blocks from the evaluation — do not suggest blocked peptides.
- Use markdown sparingly (bold, bullets). No huge headers.
- If asked something outside scope, politely redirect to the patient case.
- Brief clinical-judgment reminder only on substantive medical answers.
"""

_state: dict = {}
_init_lock = threading.Lock()


def ensure_initialized() -> None:
    """Lazy init for Chroma collection and OpenRouter LLM client."""
    if _state.get("collection") and _state.get("llm"):
        return

    with _init_lock:
        if _state.get("collection") and _state.get("llm"):
            return

        missing = [
            name
            for name, value in {
                "OPENROUTER_API_KEY": settings.openrouter_api_key,
                "CHROMA_API_KEY": settings.chroma_api_key,
                "CHROMA_TENANT": settings.chroma_tenant,
            }.items()
            if not value
        ]
        if missing:
            raise RuntimeError(f"Missing env vars: {missing}. Check .env")

        _state["llm"] = OpenAI(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
        )

        client = get_chroma_client()
        embed_fn = build_embedding_function()
        _state["collection"] = client.get_or_create_collection(
            name=settings.chroma_collection,
            embedding_function=embed_fn,
            metadata={"hnsw:space": "cosine"},
        )


def get_api_info() -> dict:
    return {
        "name": "Frontier BioMed Peptide Intake",
        "status": "ok",
        "collection": settings.chroma_collection,
        "chat_model": settings.chat_model,
        "embed_model": settings.embed_model,
        "flow_version": "1.0",
    }


def get_health() -> dict:
    try:
        ensure_initialized()
        count = _state["collection"].count()
        return {"ok": True, "vectors": count}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def get_questionnaire_flow() -> dict:
    ensure_initialized()
    return get_flow_definition()


def evaluate_questionnaire(req: IntakeRequest) -> dict:
    ensure_initialized()
    return evaluate_intake(req.answers)


def recommend_questionnaire(req: IntakeRequest) -> dict:
    ensure_initialized()
    evaluation = evaluate_intake(req.answers)
    safety = evaluation.get("safety", {})

    if safety.get("intake_blocked"):
        return {
            "evaluation": evaluation,
            "answer": (
                "### Intake stopped\n\n"
                + "\n".join(f"- {s}" for s in safety.get("hard_stops", []))
                + f"\n\n*{evaluation.get('disclaimer', '')}*"
            ),
            "sources": [],
        }

    k = req.top_k or settings.top_k
    rag_q = build_rag_query(evaluation, req.answers)
    context, sources = _retrieve(rag_q, k)
    if not context.strip():
        context = "(Limited KB hits — rely on deterministic evaluation.)"

    try:
        answer = _generate_intake_recommendation(req.answers, evaluation, context)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM error: {exc}") from exc

    return {
        "evaluation": evaluation,
        "answer": answer,
        "sources": [source.model_dump() for source in sources],
    }


def followup_questionnaire(req: FollowUpRequest) -> dict:
    ensure_initialized()
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Empty question.")

    k = req.top_k or settings.top_k
    rag_q = f"{question}. Patient goal: {req.evaluation.get('primary_goal', '')}. "
    recs = req.evaluation.get("recommendations") or []
    if recs:
        rag_q += "Peptides: " + ", ".join(p.get("name", "") for p in recs[:4])

    context, sources = _retrieve(rag_q, k)
    if not context.strip():
        context = "(No additional KB context retrieved.)"

    try:
        answer = _generate_followup(
            req.answers,
            req.evaluation,
            req.recommendation,
            req.messages,
            question,
            context,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM error: {exc}") from exc

    return {
        "answer": answer,
        "sources": [source.model_dump() for source in sources],
    }


async def recommend_for_patient(
    *,
    user_id: str,
    patient_id: str,
    top_k: Optional[int] = None,
) -> dict:
    from services.routes.chat import patient_service

    patient = await patient_service.get_patient(user_id=user_id, patient_id=patient_id)
    answers = patient.get("intake_answers") or {}
    if not answers:
        raise HTTPException(status_code=400, detail="Submit intake answers before requesting a recommendation.")

    req = IntakeRequest(answers=answers, top_k=top_k)
    result = recommend_questionnaire(req)
    saved = await patient_service.save_patient_recommendation(
        user_id=user_id,
        patient_id=patient_id,
        answers=answers,
        evaluation=result["evaluation"],
        recommendation=result["answer"],
        sources=result.get("sources") or [],
    )
    logger.info("Recommendation saved for patient %s user %s", patient_id, user_id)
    return await patient_service.build_patient_messages_response(
        user_id=user_id,
        patient_id=patient_id,
    )


async def send_message_for_patient(
    *,
    user_id: str,
    patient_id: str,
    question: str,
    top_k: Optional[int] = None,
) -> dict:
    from services.routes.chat import patient_service

    started = time.perf_counter()
    patient_entity, chat_entity = await patient_service.get_patient_for_chat(user_id, patient_id)
    if not patient_entity.evaluation or not patient_entity.recommendation:
        raise HTTPException(status_code=400, detail="Generate a recommendation before chatting.")

    history, memory_stats = trim_chat_history(chat_entity.messages)
    logger.info(
        "Follow-up context prepared for patient %s: memory total=%d trimmed=%d",
        patient_id,
        memory_stats.total_messages,
        memory_stats.trimmed_messages,
    )

    req = FollowUpRequest(
        answers=patient_entity.intake_answers,
        evaluation=patient_entity.evaluation,
        recommendation=patient_entity.recommendation,
        messages=history,
        question=question,
        top_k=top_k,
    )

    await patient_service.append_patient_message(
        user_id=user_id,
        patient_id=patient_id,
        role="user",
        content=question,
    )

    llm_started = time.perf_counter()
    result = followup_questionnaire(req)
    logger.info(
        "Follow-up LLM completed for patient %s in %.0fms",
        patient_id,
        (time.perf_counter() - llm_started) * 1000,
    )

    await patient_service.append_patient_message(
        user_id=user_id,
        patient_id=patient_id,
        role="assistant",
        content=result["answer"],
    )

    response = await patient_service.build_patient_messages_response(
        user_id=user_id,
        patient_id=patient_id,
    )
    logger.info(
        "Follow-up saved for patient %s user %s total=%.0fms",
        patient_id,
        user_id,
        (time.perf_counter() - started) * 1000,
    )
    return response


def _retrieve(query: str, k: int) -> tuple[str, List[Source]]:
    collection = _state["collection"]
    res = collection.query(query_texts=[query], n_results=k)

    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]

    context_parts: List[str] = []
    sources: List[Source] = []
    for i, (doc, meta) in enumerate(zip(docs, metas), start=1):
        meta = meta or {}
        context_parts.append(
            f"[Source {i}] Course: {meta.get('course_name', '?')}\n{doc}"
        )
        sources.append(
            Source(
                course_name=str(meta.get("course_name", "")),
                l1_name=str(meta.get("l1_name", "")),
                l2_name=str(meta.get("l2_name", "")),
                lesson_id=str(meta.get("lesson_id", "")),
                preview=doc[:200] + ("..." if len(doc) > 200 else ""),
            )
        )
    return "\n\n---\n\n".join(context_parts), sources


def _generate_intake_recommendation(answers: dict, evaluation: dict, context: str) -> str:
    llm: OpenAI = _state["llm"]
    user_prompt = (
        f"PATIENT INTAKE ANSWERS:\n{json.dumps(answers, indent=2)}\n\n"
        f"DETERMINISTIC EVALUATION:\n{json.dumps(evaluation, indent=2)}\n\n"
        f"KNOWLEDGE BASE CONTEXT:\n{context}\n\n"
        "Generate the provider-facing Recommendation Card."
    )
    resp = llm.chat.completions.create(
        model=settings.chat_model,
        temperature=0.2,
        messages=[
            {"role": "system", "content": INTAKE_SYSTEM},
            {"role": "user", "content": user_prompt},
        ],
    )
    return (resp.choices[0].message.content or "").strip()


def _generate_followup(
    answers: dict,
    evaluation: dict,
    recommendation: str,
    history: List[ChatMessage],
    question: str,
    context: str,
) -> str:
    llm: OpenAI = _state["llm"]
    context_block = (
        f"PATIENT INTAKE:\n{json.dumps(answers, indent=2)}\n\n"
        f"EVALUATION:\n{json.dumps(evaluation, indent=2)}\n\n"
        f"RECOMMENDATION CARD:\n{recommendation}\n\n"
        f"KNOWLEDGE BASE:\n{context}"
    )
    llm_messages: List[dict] = [
        {"role": "system", "content": FOLLOWUP_SYSTEM},
        {"role": "user", "content": f"Case context (reference throughout):\n{context_block}"},
        {
            "role": "assistant",
            "content": "Understood. I'll help with follow-up questions about this patient's peptide recommendation.",
        },
    ]
    for msg in history:
        llm_messages.append({"role": msg.role, "content": msg.content})
    llm_messages.append({"role": "user", "content": question})

    resp = llm.chat.completions.create(
        model=settings.chat_model,
        temperature=0.3,
        messages=llm_messages,
    )
    return (resp.choices[0].message.content or "").strip()
