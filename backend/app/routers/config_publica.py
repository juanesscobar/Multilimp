"""Expone configuración pública del negocio al frontend (sin secrets)."""
from fastapi import APIRouter
from pydantic import BaseModel
from app.config import settings

router = APIRouter()


class ConfigPublica(BaseModel):
    nombre_negocio: str
    whatsapp_negocio: str
    alias_pago: str
    cloudinary_habilitado: bool


@router.get("", response_model=ConfigPublica)
def config_publica():
    """Configuración pública del negocio — sin auth, usada por el frontend."""
    return ConfigPublica(
        nombre_negocio=settings.nombre_negocio,
        whatsapp_negocio=settings.whatsapp_negocio,
        alias_pago=settings.alias_pago,
        cloudinary_habilitado=bool(
            settings.cloudinary_cloud_name
            and settings.cloudinary_api_key
            and settings.cloudinary_api_secret
        ),
    )
