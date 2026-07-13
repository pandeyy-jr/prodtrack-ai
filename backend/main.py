import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

app = FastAPI(title="ProdTrack AI Backend")

BACKEND_DIR = Path(__file__).resolve().parent
DB_PATH = BACKEND_DIR / "prodtrack.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH.as_posix()}")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://prodtrack-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@app.on_event("startup")
async def startup():
    try:
        from .models import Base
        from .migrations import migrate_piece_count_schema
    except ImportError:
        from models import Base
        from migrations import migrate_piece_count_schema

    await migrate_piece_count_schema(engine)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "ProdTrack AI Backend"}

# Include routers
try:
    from .routes import supervisor, admin
except ImportError:
    from routes import supervisor, admin

app.include_router(supervisor, prefix="/supervisor", tags=["supervisor"])
app.include_router(admin, prefix="/admin", tags=["admin"])
