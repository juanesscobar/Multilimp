from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

# Normalizar URL y forzar psycopg2 para evitar que SQLAlchemy elija psycopg3
_db_url = settings.database_url
_db_url = _db_url.replace("postgres://", "postgresql+psycopg2://", 1)
_db_url = _db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

_connect_args = {}
if "localhost" not in _db_url and "127.0.0.1" not in _db_url:
    _connect_args = {"sslmode": "require"}

engine = create_engine(_db_url, echo=False, connect_args=_connect_args)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
