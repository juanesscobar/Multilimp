from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql://admin:admin123@localhost:5432/limpieza_db"
    secret_key: str = "cambia-esto-en-produccion-clave-muy-secreta-larga"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    whatsapp_negocio: str = "595973996276"
    alias_pago: str = "0973996276"
    nombre_negocio: str = "MultiLimp"

    # CORS: lista separada por comas
    # Dev local: http://localhost:3000,http://localhost:3001
    # Render: https://multilimp-frontend.onrender.com,http://localhost:3000
    allowed_origins: str = "http://localhost:3000,http://localhost:3001"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
