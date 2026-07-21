# Frontier BioMed — Clinical Peptide Adviser

Provider-facing web app for structured patient intake, safety-gated peptide ranking, and RAG-enriched clinical recommendations.

**Production:** https://ai-adviser-wheat.vercel.app

---

## What it does

1. **Patient intake wizard** (Stages 0–6) — consent, snapshot, safety gate, goals, branch questions, preferences
2. **Deterministic evaluation** — safety rules + ranked peptides (`questionnaire.py`)
3. **RAG + LLM** — retrieves peptide course chunks from Chroma Cloud, generates a Recommendation Card
4. **Follow-up chat** — provider can ask clarifying questions about the case

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI (Python 3.12) |
| Frontend | Single-page app (`public/index.html`) |
| LLM | OpenRouter (`CHAT_MODEL`, default `openai/gpt-5.5`) |
| Embeddings | OpenRouter (`perplexity/pplx-embed-v1-4b`) |
| Vector DB | Chroma Cloud (`peptide_chunks` collection) |
| Deploy | Vercel (serverless Python + static `public/`) |

---

## Project structure

```
ai-adviser/
├── main.py                 # FastAPI app, API routes, LLM + RAG
├── questionnaire.py        # Intake flow, safety gates, peptide ranking
├── embed.py                # OpenRouter embedding function for Chroma
├── chroma_client.py        # Chroma Cloud client (SSL config)
├── prepare.py              # One-time: courses → chunks.json
├── upload_to_vectordb.py   # One-time: chunks.json → Chroma Cloud
├── api/index.py            # Vercel serverless entry
├── public/                 # Frontend (served in prod + local)
│   ├── index.html
│   └── static/AspektaVF.woff2
├── vercel.json             # Vercel rewrites + function timeout
├── requirements.txt
├── .env.example            # Env template (copy to .env)
└── Peptide_Chatbot_-_Final_Questionnaire_Flow.txt  # Original flow spec
```

**Not in git** (see `.gitignore`): `.env`, `courses_complete.json`, `courses/`, `chunks.json`, `.vercel/`

---

## Prerequisites

- Python 3.12+
- [OpenRouter](https://openrouter.ai/) API key (chat + embeddings)
- [Chroma Cloud](https://www.trychroma.com/) account (API key + tenant)
- [Vercel CLI](https://vercel.com/docs/cli) (for deploy)

---

## Local setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ai-adviser
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` with your keys:

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `CHAT_MODEL` | LLM for recommendations (e.g. `openai/gpt-5.5`) |
| `CHROMA_API_KEY` | Chroma Cloud API key |
| `CHROMA_TENANT` | Chroma tenant UUID |
| `CHROMA_DATABASE` | Database name (default `ai_adviser`) |
| `CHROMA_COLLECTION` | Collection name (default `peptide_chunks`) |
| `CHROMA_SSL_VERIFY` | `true` on Linux/Vercel; `false` on Windows if SSL errors |
| `EMBED_MODEL` | `perplexity/pplx-embed-v1-4b` |
| `TOP_K` | RAG chunks per query (default `6`) |

### 3. Run locally

```bash
uvicorn main:app --reload --port 8000
```

Open http://localhost:8000

---

## Vector DB — courses to Chroma Cloud

The app does **not** bundle course data. Vectors live in Chroma Cloud. Run this pipeline once (or when course content updates).

### Step 1: Get source data

Place `courses_complete.json` in the project root (not committed to git — large file).

Format: JSON array of courses, each with lessons and metadata.

### Step 2: Prepare chunks

```bash
python prepare.py
```

**Output:**

- `courses/` — one JSON file per course (local only, gitignored)
- `chunks.json` — ~45K vector-ready chunks with text + metadata

Each chunk includes: course name, topic hierarchy, lesson text, stable `id`.

### Step 3: Upload to Chroma Cloud

Ensure `.env` has Chroma + OpenRouter keys (embeddings use OpenRouter at upload time).

```bash
python upload_to_vectordb.py
```

- Batches uploads (128 chunks per batch)
- Uses **upsert** — safe to re-run without duplicates
- Collection: `peptide_chunks` (or value of `CHROMA_COLLECTION`)

**Verify:**

```bash
# After starting the app
curl http://localhost:8000/health
# Expected: {"ok":true,"vectors":45303}
```

### When to re-run

| Event | Action |
|-------|--------|
| New/updated courses | `prepare.py` → `upload_to_vectordb.py` |
| Changed embedding model | Re-upload entire collection (model must match runtime) |
| Fresh Chroma project | Create collection + full upload |

---

## Deploy to Vercel

Production is configured for Vercel serverless.

### First-time deploy

```bash
npm i -g vercel   # or use npx vercel
vercel login
vercel link       # link to project ai-adviser
```

Set production env vars (mirror `.env.example`):

```bash
vercel env add OPENROUTER_API_KEY production
vercel env add CHROMA_API_KEY production
# ... repeat for all variables in .env.example
```

Or set them in the [Vercel dashboard](https://vercel.com/wi223488gmailcoms-projects/ai-adviser) under **Settings → Environment Variables**.

### Deploy

```bash
vercel --prod
```

**URLs:**

- App: https://ai-adviser-wheat.vercel.app
- Dashboard: https://vercel.com/wi223488gmailcoms-projects/ai-adviser

### Frontend changes

Edit `public/index.html` (and assets under `public/static/`). Redeploy with `vercel --prod`.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Intake UI |
| `GET` | `/health` | Chroma connection + vector count |
| `GET` | `/api/info` | App metadata |
| `GET` | `/questionnaire/flow` | Full intake question schema |
| `POST` | `/questionnaire/evaluate` | Deterministic evaluation only |
| `POST` | `/questionnaire/recommend` | Evaluate + RAG + Recommendation Card |
| `POST` | `/questionnaire/followup` | Post-recommendation chat |

---

## How recommendation works

```
Intake answers
    → evaluate_intake()     safety gates + peptide ranking
    → build_rag_query()     search query from ranked peptides
    → Chroma retrieve       top-K course chunks
    → OpenRouter LLM        formatted Recommendation Card
```

Ranking formula: `goalFit × 0.5 + evidence × 0.3 + safety × 0.2`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `CERTIFICATE_VERIFY_FAILED` (Windows) | Set `CHROMA_SSL_VERIFY=false` in `.env` |
| `/health` returns 503 | Check Chroma keys; confirm collection exists |
| Empty recommendations | Verify vectors uploaded; check `OPENROUTER_API_KEY` |
| Vercel cold start slow | First request initializes Chroma (~5–10s); normal for serverless |
| Font not loading | Ensure `public/static/AspektaVF.woff2` is deployed |

---

## License / disclaimer

Clinical decision-support tool for licensed providers only. Outputs are recommendations, not prescriptions. Verify current peptide regulatory status before clinical use.
