"""
Database configuration — async SQLAlchemy with PostgreSQL (asyncpg) or SQLite (aiosqlite) fallback.
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./kairos.db")

# ─── Engine configuration with conditional pool settings ─────────────────────
if "sqlite" in DATABASE_URL:
    # SQLite: no connection pooling needed
    engine = create_async_engine(DATABASE_URL, echo=False)
else:
    # PostgreSQL (asyncpg): production-grade pool settings
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=300,
    )

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db():
    """Create all tables if they don't exist."""
    from models import Transaction, MetricsSnapshot  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    """Yield an async DB session."""
    async with async_session() as session:
        yield session
