"""
aiadviser/main.py
-----------------
Legacy entry point. Chat API endpoints now live in the main HOLS backend:
  backend/routes/chatroute.py
  backend/services/routes/chat/service.py

Run the HOLS API instead:
    cd backend && uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI

app = FastAPI(title="Frontier BioMed Peptide Intake (deprecated)", version="2.0.0")


@app.get("/")
def root() -> dict:
    return {
        "name": "Frontier BioMed Peptide Intake",
        "status": "deprecated",
        "message": "Use the HOLS backend chat routes instead.",
    }
