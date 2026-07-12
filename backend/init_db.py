import asyncio
import os
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from models import Base, Target

BACKEND_DIR = Path(__file__).resolve().parent
DB_PATH = BACKEND_DIR / "prodtrack.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH.as_posix()}")

async def init_db():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Insert targets
        targets = [
            Target(toy_code="TY-104", target_per_hour=312.5, target_per_shift=2500.0),
            Target(toy_code="TY-208", target_per_hour=350.0, target_per_shift=2800.0),
        ]
        for target in targets:
            session.add(target)
        await session.commit()

    print("Database initialized with targets")

if __name__ == "__main__":
    asyncio.run(init_db())
