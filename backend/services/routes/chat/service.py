"""Peptide adviser chat — intake questionnaire, RAG recommendations, and follow-up."""

from __future__ import annotations

import json
import logging
import threading
import time
from typing import Any, List, Optional

from fastapi import HTTPException
from openai import OpenAI

from config import settings
from models.chat import ChatMessage, FollowUpRequest, IntakeRequest, Source
from services.routes.chat.chroma_client import get_chroma_client
from services.routes.chat.embed import build_embedding_function
from services.routes.chat.memory import trim_chat_history
from services.routes.chat.questionnaire import (
    build_rag_query,
    build_recommendation_board,
    evaluate_intake,
    format_board_receipt,
    get_flow_definition,
)

logger = logging.getLogger(__name__)

INTAKE_SYSTEM = """You are Frontier BioMed's Peptide Recommendation assistant for licensed providers.

Output a SHORT Recommendation Card in markdown. Hard limits:
- Max ~180 words total
- Use only these headings: ### Shortlist · ### Safety · ### Labs · ### Note
- Shortlist: 2–4 peptides as bullets. Each bullet = **Name** — 1 short reason (≤18 words).
- Safety: bullets only from evaluation hard_stops/cautions (skip empty).
- Labs: ≤5 bullets from evaluation.
- Note: one sentence regulatory reminder.

RULES:
- Never prescribe doses or tell the provider to start therapy.
- Never recommend blocked/excluded peptides.
- Prefer evaluation rankings; KB only for brief mechanism/caution.
- No long paragraphs, no tables, no filler.
"""

FOLLOWUP_SYSTEM = """You are Frontier BioMed's Peptide Adviser in a live chat after the Recommendation Card.

Reply like a fast clinical SMS to the provider:
- Max 80 words (aim 40–60)
- 1–4 short bullets OR 2 short sentences — never both walls of text
- Bold peptide names only; no ### headers
- Stay on this patient case
- If FOCUS PEPTIDES lists one peptide, answer only about that peptide.
- If FOCUS PEPTIDES lists several and the question is general or a comparison, cover each named peptide. Do not drop any selected name and do not swap in unselected shortlist peptides.
- If FOCUS PEPTIDES lists several but the question names one of them, answer about that named peptide only. Do not introduce unselected shortlist peptides.
- Never prescribe doses / start therapy
- Never suggest blocked peptides
- Skip greetings, disclaimers, and restating the whole card unless asked
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
            timeout=45.0,
            max_retries=1,
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
        "chat_model_followup": settings.chat_model_followup,
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


def _normalize_focus_peptides(names: Optional[List[str]]) -> list[str]:
    seen: set[str] = set()
    cleaned: list[str] = []
    for raw in names or []:
        name = str(raw or "").strip()
        if not name or name in seen:
            continue
        seen.add(name)
        cleaned.append(name)
        if len(cleaned) >= 8:
            break
    return cleaned


def followup_questionnaire(req: FollowUpRequest) -> dict:
    ensure_initialized()
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Empty question.")

    focus_peptides = _normalize_focus_peptides(req.focus_peptides)

    # Skip RAG for ultra-short meta questions — evaluation context is enough.
    needs_rag = _question_needs_rag(question)
    sources: List[Source] = []
    context = ""
    if needs_rag:
        k = min(req.top_k or settings.top_k, settings.top_k)
        rag_q = f"{question}. Patient goal: {req.evaluation.get('primary_goal', '')}. "
        recs = req.evaluation.get("recommendations") or []
        peptide_names = focus_peptides or [p.get("name", "") for p in recs[:4] if p.get("name")]
        if peptide_names:
            rag_q += "Peptides: " + ", ".join(peptide_names)
        context, sources = _retrieve(rag_q, k)
        if not context.strip():
            context = "(No additional KB context.)"

    try:
        answer = _generate_followup(
            req.answers,
            req.evaluation,
            req.recommendation,
            req.messages,
            question,
            context,
            focus_peptides=focus_peptides,
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
    board = build_recommendation_board(result["evaluation"], confidence="balanced")
    await patient_service.save_patient_recommendation(
        user_id=user_id,
        patient_id=patient_id,
        answers=answers,
        evaluation=result["evaluation"],
        recommendation=result["answer"],
        sources=result.get("sources") or [],
        recommendation_board=board,
    )
    logger.info("Recommendation saved for patient %s user %s", patient_id, user_id)
    try:
        from services.notification import events as notify_events

        notify_events.student_recommendation_ready(
            user_id=user_id,
            patient_name=str(patient.get("display_name") or "Patient"),
        )
    except Exception:
        logger.exception("Failed to queue recommendation notification user=%s patient=%s", user_id, patient_id)
    return await patient_service.build_patient_messages_response(
        user_id=user_id,
        patient_id=patient_id,
    )


async def update_board_for_patient(
    *,
    user_id: str,
    patient_id: str,
    confidence: Optional[str] = None,
    preferred: Optional[str] = None,
    clear_preferred: bool = False,
    focus_peptides: Optional[List[str]] = None,
) -> dict:
    """Rebuild War Room board from stored evaluation (deterministic, no LLM)."""
    from services.routes.chat import patient_service

    patient_entity, _chat = await patient_service.get_patient_for_chat(user_id, patient_id)
    evaluation = patient_entity.evaluation
    if not evaluation:
        raise HTTPException(status_code=400, detail="Generate a recommendation before updating the board.")

    current = patient_entity.recommendation_board or {}
    next_confidence = confidence or current.get("confidence") or "balanced"
    next_preferred: Optional[str]
    if clear_preferred:
        next_preferred = None
    elif preferred is not None and preferred.strip():
        next_preferred = preferred.strip()
    else:
        next_preferred = current.get("preferred")

    next_focus = (
        focus_peptides if focus_peptides is not None else current.get("focus_peptides")
    )

    board = build_recommendation_board(
        evaluation,
        confidence=str(next_confidence),
        preferred=next_preferred,
        focus_peptides=next_focus,
    )

    changes: list[dict] = []
    prev_confidence = current.get("confidence") or "balanced"
    if str(prev_confidence) != board["confidence"]:
        changes.append(
            {
                "field": "Confidence",
                "from": prev_confidence,
                "to": board["confidence"],
            }
        )
    prev_preferred = current.get("preferred")
    if prev_preferred != board.get("preferred"):
        changes.append(
            {
                "field": "Preferred peptide",
                "from": prev_preferred or "none",
                "to": board.get("preferred") or "none",
            }
        )

    receipt = format_board_receipt(board, changes=changes) if changes else None
    return await patient_service.save_patient_board(
        user_id=user_id,
        patient_id=patient_id,
        recommendation_board=board,
        receipt=receipt,
    )


async def send_message_for_patient(
    *,
    user_id: str,
    patient_id: str,
    question: str,
    top_k: Optional[int] = None,
    focus_peptides: Optional[List[str]] = None,
) -> dict:
    from services.routes.chat import patient_service

    started = time.perf_counter()
    patient_entity, chat_entity = await patient_service.get_patient_for_chat(user_id, patient_id)
    if not patient_entity.evaluation or not patient_entity.recommendation:
        raise HTTPException(status_code=400, detail="Generate a recommendation before chatting.")

    turns_used = sum(
        1
        for message in chat_entity.messages
        if message.get("role") == "user" and message.get("kind", "message") == "message"
    )
    if turns_used >= settings.chat_max_turns:
        raise HTTPException(
            status_code=400,
            detail=f"This consultation has reached the {settings.chat_max_turns}-turn limit.",
        )

    allowed_names = {
        str(item.get("name") or "").strip()
        for item in (patient_entity.recommendation_board or {}).get("ranked") or []
        if item.get("name")
    }
    if not allowed_names:
        allowed_names = {
            str(item.get("name") or "").strip()
            for item in (patient_entity.evaluation or {}).get("recommendations") or []
            if item.get("name")
        }
    current_board = patient_entity.recommendation_board or {}
    requested_focus = _normalize_focus_peptides(focus_peptides)
    if not requested_focus:
        requested_focus = _normalize_focus_peptides(current_board.get("focus_peptides"))
    scoped_focus = [name for name in requested_focus if name in allowed_names]
    if not scoped_focus:
        preferred = str(current_board.get("preferred") or "").strip()
        if preferred and preferred in allowed_names:
            scoped_focus = [preferred]
        else:
            scoped_focus = [next(iter(allowed_names))] if allowed_names else []

    is_first_chat = not chat_entity.messages

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
        focus_peptides=scoped_focus,
    )

    # Generate first, then persist user+assistant in one Dynamo write (lower latency).
    llm_started = time.perf_counter()
    result = followup_questionnaire(req)
    logger.info(
        "Follow-up LLM completed for patient %s in %.0fms",
        patient_id,
        (time.perf_counter() - llm_started) * 1000,
    )

    next_board = None
    if patient_entity.evaluation:
        next_board = build_recommendation_board(
            patient_entity.evaluation,
            confidence=str(current_board.get("confidence") or "balanced"),
            preferred=current_board.get("preferred"),
            focus_peptides=scoped_focus,
        )

    await patient_service.append_patient_messages(
        user_id=user_id,
        patient_id=patient_id,
        entries=[
            {"role": "user", "content": question, "kind": "message"},
            {"role": "assistant", "content": result["answer"], "kind": "message"},
        ],
        recommendation_board=next_board,
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
    if is_first_chat:
        try:
            from services.notification import events as notify_events

            notify_events.student_chat_started(
                user_id=user_id,
                patient_name=patient_entity.display_name,
            )
        except Exception:
            logger.exception("Failed to queue chat notification user=%s patient=%s", user_id, patient_id)
    return response


def _question_needs_rag(question: str) -> bool:
    q = question.lower()
    # Ranking / board questions are answered from evaluation alone.
    if any(token in q for token in ("why is", "why #", "rank #", "shortlist", "top peptide", "clinical note")):
        return False
    keywords = (
        "mechanism",
        "side effect",
        "storage",
        "handling",
        "evidence",
        "compare",
        "vs ",
        "versus",
        "lab",
        "safety",
        "caution",
        "monitor",
        "how does",
        "stack",
        "contraindic",
        "half-life",
        "reconstitut",
    )
    return any(token in q for token in keywords)


def _compact_answers(answers: dict) -> dict:
    keys = (
        "age",
        "sex",
        "pregnancy",
        "height_cm",
        "weight_kg",
        "activity",
        "cancer",
        "mtc_men2",
        "peptide_allergy",
        "allergy_detail",
        "conditions",
        "medications",
        "primary_goal",
        "secondary_goal",
        "injection_tolerance",
        "complexity",
        "timeline",
    )
    compact = {key: answers[key] for key in keys if key in answers and answers[key] not in ("", None, [])}
    # Keep a few goal-branch fields if present
    for key, value in answers.items():
        if key.startswith(("a_", "b_", "c_", "d_", "e_", "f_", "g_", "h_")) and value not in ("", None, []):
            compact[key] = value
    return compact


def _compact_peptide(peptide: dict) -> dict:
    return {
        "name": peptide.get("name"),
        "evidence": peptide.get("evidence"),
        "best_when": peptide.get("best_when"),
        "score": peptide.get("score"),
        "tags": peptide.get("tags"),
    }


def _compact_evaluation(evaluation: dict) -> dict:
    safety = evaluation.get("safety") or {}
    return {
        "primary_goal": evaluation.get("primary_goal"),
        "secondary_goal": evaluation.get("secondary_goal"),
        "recommendations": [_compact_peptide(p) for p in (evaluation.get("recommendations") or [])[:4]],
        "secondary_recommendations": [
            _compact_peptide(p) for p in (evaluation.get("secondary_recommendations") or [])[:2]
        ],
        "stacks": evaluation.get("stacks") or [],
        "labs": (evaluation.get("labs") or [])[:6],
        "safety": {
            "hard_stops": safety.get("hard_stops") or [],
            "cautions": (safety.get("cautions") or [])[:6],
            "flags": (safety.get("flags") or [])[:6],
            "blocked_peptides": (safety.get("blocked_peptides") or [])[:12],
            "bmi": safety.get("bmi"),
        },
        "disclaimer": evaluation.get("disclaimer"),
    }


def _truncate(text: str, limit: int) -> str:
    text = (text or "").strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def _chat_completion(
    *,
    model: str,
    temperature: float,
    max_tokens: int,
    messages: List[dict],
) -> str:
    llm: OpenAI = _state["llm"]
    resp = llm.chat.completions.create(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        messages=messages,
        extra_body={
            "provider": {"sort": "latency"},
        },
    )
    return (resp.choices[0].message.content or "").strip()


def _retrieve(query: str, k: int) -> tuple[str, List[Source]]:
    collection = _state["collection"]
    res = collection.query(query_texts=[query], n_results=max(1, k))

    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]

    context_parts: List[str] = []
    sources: List[Source] = []
    for i, (doc, meta) in enumerate(zip(docs, metas), start=1):
        meta = meta or {}
        clipped = _truncate(doc, 700)
        context_parts.append(f"[S{i}] {meta.get('course_name', '?')}: {clipped}")
        sources.append(
            Source(
                course_name=str(meta.get("course_name", "")),
                l1_name=str(meta.get("l1_name", "")),
                l2_name=str(meta.get("l2_name", "")),
                lesson_id=str(meta.get("lesson_id", "")),
                preview=doc[:160] + ("..." if len(doc) > 160 else ""),
            )
        )
    return "\n".join(context_parts), sources


def _generate_intake_recommendation(answers: dict, evaluation: dict, context: str) -> str:
    user_prompt = (
        f"INTAKE:\n{json.dumps(_compact_answers(answers), separators=(',', ':'))}\n\n"
        f"EVAL:\n{json.dumps(_compact_evaluation(evaluation), separators=(',', ':'))}\n\n"
        f"KB:\n{_truncate(context, 2400)}\n\n"
        "Write the short Recommendation Card now."
    )
    return _chat_completion(
        model=settings.chat_model,
        temperature=0.15,
        max_tokens=settings.chat_max_tokens_intake,
        messages=[
            {"role": "system", "content": INTAKE_SYSTEM},
            {"role": "user", "content": user_prompt},
        ],
    )


def _generate_followup(
    answers: dict,
    evaluation: dict,
    recommendation: str,
    history: List[ChatMessage],
    question: str,
    context: str,
    focus_peptides: Optional[List[str]] = None,
) -> str:
    focus = _normalize_focus_peptides(focus_peptides)
    focus_line = (
        f"FOCUS PEPTIDES: {', '.join(focus)}. Answer only about these unless asked otherwise.\n"
        if focus
        else ""
    )
    case_block = (
        f"{focus_line}"
        f"INTAKE:{json.dumps(_compact_answers(answers), separators=(',', ':'))}\n"
        f"EVAL:{json.dumps(_compact_evaluation(evaluation), separators=(',', ':'))}\n"
        f"CARD:{_truncate(recommendation, 1200)}\n"
        f"KB:{_truncate(context, 1400) if context else '(none)'}"
    )
    llm_messages: List[dict[str, Any]] = [
        {"role": "system", "content": FOLLOWUP_SYSTEM},
        {"role": "user", "content": f"Case (ref only):\n{case_block}"},
        {
            "role": "assistant",
            "content": "Ready — ask briefly.",
        },
    ]
    # Keep enough recent turns for a 50-question consult; memory already token-trims.
    recent = history[-100:] if history else []
    for msg in recent:
        content = msg.content
        if msg.role == "assistant":
            content = _truncate(content, 500)
        else:
            content = _truncate(content, 400)
        llm_messages.append({"role": msg.role, "content": content})
    if not focus:
        focus_hint = ""
    elif len(focus) == 1:
        focus_hint = (
            f"Selected peptides: {focus[0]}. Answer only about {focus[0]}; "
            "do not switch to other shortlist peptides.\n\n"
        )
    else:
        named = ", ".join(focus)
        focus_hint = (
            f"Selected peptides: {named}. Cover each of these peptides in the reply. "
            "Do not omit any selected name and do not discuss unselected shortlist peptides.\n\n"
        )
    llm_messages.append(
        {
            "role": "user",
            "content": f"{focus_hint}{question}\n\n(Reply ≤80 words. Bullets preferred.)",
        }
    )

    return _chat_completion(
        model=settings.chat_model_followup,
        temperature=0.2,
        max_tokens=settings.chat_max_tokens_followup,
        messages=llm_messages,
    )
