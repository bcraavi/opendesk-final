"""
OpenDesk Server — Single-file self-hostable backend
Connects to any LLM: Anthropic, OpenAI, Gemini, Ollama, or any OpenAI-compatible API

Run:   python server.py
Deploy: docker build -t opendesk . && docker run -p 8080:8080 opendesk
"""

import os
import json
import time
import uuid
import asyncio
import logging
from pathlib import Path
from datetime import datetime

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# ─── Config ───────────────────────────────────────────────
PORT = int(os.getenv("PORT", "8080"))
DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))
DOCS_DIR = DATA_DIR / "documents"
DOCS_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("opendesk")

# ─── App ──────────────────────────────────────────────────
app = FastAPI(title="OpenDesk", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Models ───────────────────────────────────────────────
class Document(BaseModel):
    id: str = ""
    title: str = "Untitled"
    content: str = ""
    created_at: str = ""
    updated_at: str = ""


class AIRequest(BaseModel):
    action: str
    text: str
    prompt: Optional[str] = None
    provider: str = "anthropic"
    model: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None


# ─── Document Storage (file-based, no DB needed) ─────────
def _doc_path(doc_id: str) -> Path:
    return DOCS_DIR / f"{doc_id}.json"


def _now() -> str:
    return datetime.utcnow().isoformat() + "Z"


@app.post("/api/docs")
async def create_doc(doc: Document):
    doc.id = doc.id or str(uuid.uuid4())[:8]
    doc.created_at = _now()
    doc.updated_at = _now()
    _doc_path(doc.id).write_text(json.dumps(doc.dict(), indent=2))
    log.info(f"Created doc: {doc.id}")
    return doc.dict()


@app.get("/api/docs")
async def list_docs():
    docs = []
    for f in sorted(DOCS_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            docs.append(json.loads(f.read_text()))
        except Exception:
            pass
    return docs


@app.get("/api/docs/{doc_id}")
async def get_doc(doc_id: str):
    path = _doc_path(doc_id)
    if not path.exists():
        raise HTTPException(404, "Document not found")
    return json.loads(path.read_text())


@app.put("/api/docs/{doc_id}")
async def update_doc(doc_id: str, doc: Document):
    path = _doc_path(doc_id)
    if path.exists():
        existing = json.loads(path.read_text())
        doc.created_at = existing.get("created_at", _now())
    else:
        doc.created_at = _now()
    doc.id = doc_id
    doc.updated_at = _now()
    path.write_text(json.dumps(doc.dict(), indent=2))
    return doc.dict()


@app.delete("/api/docs/{doc_id}")
async def delete_doc(doc_id: str):
    path = _doc_path(doc_id)
    if path.exists():
        path.unlink()
    return {"deleted": True}


# ─── LLM Proxy ───────────────────────────────────────────
# Routes AI requests to whichever provider the user configured

SYSTEM_PROMPT = """You are a writing assistant integrated into a document editor called OpenDesk. 
You help users improve, transform, and generate text. 
Be direct — return only the requested output, no explanations or preamble unless asked.
Preserve the original formatting style (markdown) when applicable."""


async def call_anthropic(api_key: str, model: str, prompt: str, text: str) -> str:
    """Call Anthropic Claude API"""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": model or "claude-sonnet-4-20250514",
                "max_tokens": 2000,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": f"{prompt}\n\n---\n\n{text}"}],
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["content"][0]["text"]


async def call_openai(api_key: str, model: str, prompt: str, text: str, base_url: str = None) -> str:
    """Call OpenAI or any OpenAI-compatible API (LMStudio, Together, vLLM, etc.)"""
    url = (base_url or "https://api.openai.com").rstrip("/") + "/v1/chat/completions"
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model or "gpt-4o",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"{prompt}\n\n---\n\n{text}"},
                ],
                "max_tokens": 2000,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def call_gemini(api_key: str, model: str, prompt: str, text: str) -> str:
    """Call Google Gemini API"""
    model = model or "gemini-2.0-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            url,
            headers={"Content-Type": "application/json"},
            json={
                "contents": [
                    {"parts": [{"text": f"{SYSTEM_PROMPT}\n\n{prompt}\n\n---\n\n{text}"}]}
                ],
                "generationConfig": {"maxOutputTokens": 2000},
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def call_ollama(model: str, prompt: str, text: str, base_url: str = None) -> str:
    """Call Ollama local API"""
    url = (base_url or "http://localhost:11434").rstrip("/") + "/api/chat"
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            url,
            json={
                "model": model or "llama3.1",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"{prompt}\n\n---\n\n{text}"},
                ],
                "stream": False,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["message"]["content"]


# Default prompts per action
ACTION_PROMPTS = {
    "improve": "Improve the writing quality, grammar, clarity, and flow. Return only the improved text.",
    "summarize": "Summarize concisely. Return only the summary.",
    "expand": "Expand with more detail and depth. Return only the expanded text.",
    "simplify": "Simplify to be clearer and easier to understand. Return only the simplified text.",
    "fix": "Fix all grammar, spelling, and punctuation errors. Return only the corrected text.",
    "formal": "Rewrite in a professional, formal tone. Return only the rewritten text.",
    "casual": "Rewrite in a casual, friendly tone. Return only the rewritten text.",
    "bullets": "Convert into clear bullet points. Return only the bullet points.",
    "translate_es": "Translate to Spanish. Return only the translation.",
    "translate_fr": "Translate to French. Return only the translation.",
    "explain": "Explain simply for someone unfamiliar. Return only the explanation.",
    "continue": "Continue writing from where this leaves off, matching style. Return only the continuation.",
}


@app.post("/api/ai")
async def ai_endpoint(req: AIRequest):
    prompt = req.prompt or ACTION_PROMPTS.get(req.action, "Process this text:")
    text = req.text

    if not text.strip():
        return {"text": "", "error": "No text provided"}

    try:
        if req.provider == "anthropic":
            result = await call_anthropic(req.api_key, req.model, prompt, text)
        elif req.provider in ("openai", "custom"):
            result = await call_openai(req.api_key, req.model, prompt, text, req.base_url)
        elif req.provider == "gemini":
            result = await call_gemini(req.api_key, req.model, prompt, text)
        elif req.provider == "ollama":
            result = await call_ollama(req.model, prompt, text, req.base_url)
        else:
            return {"text": "", "error": f"Unknown provider: {req.provider}"}

        return {"text": result, "action": req.action, "provider": req.provider}

    except httpx.HTTPStatusError as e:
        log.error(f"LLM API error: {e.response.status_code} - {e.response.text[:200]}")
        error_msg = f"API error ({e.response.status_code})"
        try:
            err_data = e.response.json()
            error_msg = err_data.get("error", {}).get("message", error_msg)
        except Exception:
            pass
        return {"text": "", "error": error_msg}
    except httpx.ConnectError:
        return {"text": "", "error": f"Cannot connect to {req.provider}. Is the service running?"}
    except Exception as e:
        log.error(f"AI error: {e}")
        return {"text": "", "error": str(e)}


# ─── Health ───────────────────────────────────────────────
@app.get("/api/health")
async def health():
    doc_count = len(list(DOCS_DIR.glob("*.json")))
    return {"status": "ok", "documents": doc_count, "version": "0.1.0"}


# ─── Serve Frontend ──────────────────────────────────────
# In production, the React app is built and served as static files
STATIC_DIR = Path("./static")
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {
            "app": "OpenDesk",
            "version": "0.1.0",
            "api_docs": "/docs",
            "note": "Frontend not built yet. Run: cd frontend && npm run build",
        }


# ─── Run ──────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    log.info(f"""
╔══════════════════════════════════════════════╗
║         OpenDesk Server v0.1.0               ║
║         http://localhost:{PORT}                ║
║         API docs: http://localhost:{PORT}/docs  ║
║         Data dir: {DATA_DIR}                   ║
╚══════════════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=PORT)
