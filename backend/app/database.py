import logging
from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

logger = logging.getLogger(__name__)

# Render provee "postgres://" pero SQLAlchemy 2.0 requiere "postgresql://"
_db_url = settings.database_url.replace("postgres://", "postgresql://", 1)

# Log del host para diagnóstico (sin mostrar la contraseña)
try:
    from urllib.parse import urlparse
    _parsed = urlparse(_db_url)
    logger.warning(f"[DB] Conectando a host={_parsed.hostname} port={_parsed.port} db={_parsed.path}")
except Exception:
    logger.warning(f"[DB] DATABASE_URL no parseable")

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
