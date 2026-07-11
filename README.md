# House of Life Sciences (HOLS)

Monorepo for the **House of Life Sciences** platform — a modern scientific institution for peptide education, clinical application, and professional community.

## Project structure

```
HOLS/
├── frontend/     Next.js 16 app (marketing site + UI)
├── backend/      FastAPI REST API
├── README.md
└── .gitignore
```

## Frontend

- **Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Brand config:** `frontend/src/config/brand.ts`
- **Content:** `frontend/src/content/`

### Run locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy on Vercel

1. Import this repository in [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Vercel will detect Next.js via `frontend/vercel.json`.
4. Deploy.

## Backend

- **Stack:** FastAPI, Uvicorn, Pydantic

### Run locally

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### API endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/` | Welcome message |
| GET | `/api/health` | Health check |
| GET | `/api/test` | Test route |
| GET | `/docs` | Swagger UI |

API base URL: [http://127.0.0.1:8000](http://127.0.0.1:8000)

## Repository

[https://github.com/muhammadhasnain100/hols](https://github.com/muhammadhasnain100/hols)

## License

Proprietary — House of Life Sciences.
