"""
prepare_data.py
---------------
SIRF data prepare karta hai. Koi vector DB / embedding nahi (woh baad me).

Do kaam:
  1) SPLIT:  'courses_complete.json' (courses ka array) ko todke
             har course ki alag file -> courses/ folder me.

  2) CHUNK:  har lesson ka ek chunk banata hai (text + metadata) aur
             sabko 'chunks.json' me save karta hai. Ye file baad me
             seedha vector DB me daal sakte ho.

Koi extra library nahi chahiye - sirf Python.

Chalao:
    python prepare_data.py

Input:
    courses_complete.json

Output:
    courses/          <-- har course ki alag JSON
    chunks.json       <-- vector-ready chunks (text + metadata + id)
"""

import json
import os
import re

# ---------- Settings ----------
INPUT_FILE = "courses_complete.json"
COURSES_DIR = "courses"
CHUNKS_FILE = "chunks.json"


def slugify(name: str) -> str:
    """Course name -> safe filename (letters/numbers/underscore only)."""
    name = (name or "").strip().lower()
    name = re.sub(r"[^a-z0-9]+", "_", name).strip("_")
    return name or "course"


def load_courses(input_file):
    """
    Input padhta hai. Handle karta hai:
      - seedha array:      [ {..}, {..} ]
      - key ke andar:      { "courses": [ ... ] }
      - single course:     { "course_name": ... }
    """
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("courses", "data", "items"):
            if isinstance(data.get(key), list):
                return data[key]
        if "course_name" in data:
            return [data]
    raise ValueError("Input me courses ka array nahi mila.")


# ============================================================
# STEP 1 — SPLIT into courses/ folder
# ============================================================

def split_courses(courses, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    used = {}
    saved = []

    for course in courses:
        base = slugify(course.get("course_name", "unknown_course"))

        # duplicate naam -> _1, _2 laga do (overwrite se bachne ke liye)
        if base in used:
            used[base] += 1
            fname = f"{base}_{used[base]}.json"
        else:
            used[base] = 0
            fname = f"{base}.json"

        path = os.path.join(out_dir, fname)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(course, f, ensure_ascii=False, indent=2)
        saved.append(fname)

    print(f"STEP 1: {len(saved)} courses alag files me -> '{out_dir}/'")
    return saved


# ============================================================
# STEP 2 — CHUNK (text + metadata) -> chunks.json
# ============================================================

def lesson_to_text(course_name, l1, l2, lesson):
    """Ek lesson ka readable text (ye embed hoga baad me)."""
    parts = [
        f"Course: {course_name}",
        f"Topic: {l1} > {l2}",
        f"Rule/Fact: {lesson.get('fact', '')}",
    ]
    if lesson.get("supporting_content"):
        parts.append(f"Explanation: {lesson['supporting_content']}")
    if lesson.get("study_bullets"):
        parts.append(f"Key points:\n{lesson['study_bullets']}")
    return "\n".join(parts)


def build_chunks(courses):
    """Har lesson -> ek chunk dict {id, text, metadata}."""
    chunks = []
    seen = set()

    for course in courses:
        cname = course.get("course_name", "Unknown Course")

        for topic in course.get("topics", []):
            l1 = topic.get("l1_name", "")

            for section in topic.get("sections", []):
                l2 = section.get("l2_name", "")

                for lesson in section.get("lessons", []):
                    lid = lesson.get("id")
                    if not lid:
                        continue

                    uid = f"{slugify(cname)}::{lid}"
                    if uid in seen:          # duplicate skip
                        continue
                    seen.add(uid)

                    chunks.append({
                        "id": uid,
                        "text": lesson_to_text(cname, l1, l2, lesson),
                        "metadata": {
                            "course_name": cname,
                            "l1_name": l1,
                            "l2_name": l2,
                            "lesson_id": lid,
                        },
                    })

    print(f"STEP 2: {len(chunks)} chunks banaye.")
    return chunks


def save_chunks(chunks, out_file):
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    print(f"        '{out_file}' me save (vector-ready).")


# ============================================================
# MAIN
# ============================================================

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"'{INPUT_FILE}' nahi mili. Isi folder me rakho.")
        return

    courses = load_courses(INPUT_FILE)
    print(f"Total {len(courses)} courses mile.\n")

    split_courses(courses, COURSES_DIR)

    chunks = build_chunks(courses)
    if not chunks:
        print("Koi chunk nahi bana - JSON structure check karo.")
        return
    save_chunks(chunks, CHUNKS_FILE)

    # chhota summary (kitne chunks per course)
    per_course = {}
    for c in chunks:
        cn = c["metadata"]["course_name"]
        per_course[cn] = per_course.get(cn, 0) + 1
    print("\nSummary (chunks per course):")
    for cn, n in per_course.items():
        print(f"  {n:>4}  {cn}")


if __name__ == "__main__":
    main()