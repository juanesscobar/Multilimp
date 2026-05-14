from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

# Render provee "postgres://" pero SQLAlchemy 2.0 requiere "postgresql://"
_db_url = settings.database_url.replace("postgres://", "postgresql://", 1)

# Render PostgreSQL externo requiere SSL; interno no, pero agregarlo no rompe nada
_connect_args = {}
if "localhost" not in _db_url and "127.0.0.1" not in _db_url:
    _connect_args = {"sslmode": "require"}

engine = create_engine(_db_url, echo=False, connect_args=_connect_args)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
