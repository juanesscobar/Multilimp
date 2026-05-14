from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

# Render provee DATABASE_URL con prefijo "postgres://" pero SQLAlchemy 2.0
# requiere "postgresql://". Este replace es seguro y no afecta URLs ya correctas.
_db_url = settings.database_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(_db_url, echo=False)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
