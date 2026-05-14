"""Expone configuración pública del negocio al frontend (sin secrets)."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from app.config import settings
from app.database import get_session
from app.models.config_negocio import ConfigNegocio

router = APIRouter()


class ConfigPublica(BaseModel):
    nombre_negocio: str
    whatsapp_negocio: str
    alias_pago: str
    datos_transferencia: str
    nombre_banco: str
    nro_cuenta: str
    titular_cuenta: str
    cloudinary_habilitado: bool


@router.get("", response_model=ConfigPublica)
def config_publica(session: Session = Depends(get_session)):
    """Configuración pública del negocio — sin auth, usada por el frontend."""
    db = session.exec(select(ConfigNegocio)).first()

    return ConfigPublica(
        nombre_negocio=db.nombre_negocio if db else settings.nombre_negocio,
        whatsapp_negocio=db.whatsapp_negocio if db else settings.whatsapp_negocio,
        alias_pago=db.alias_pago if db else settings.alias_pago,
        datos_transferencia=db.datos_transferencia if db else "",
        nombre_banco=db.nombre_banco if db else "",
        nro_cuenta=db.nro_cuenta if db else "",
        titular_cuenta=db.titular_cuenta if db else "",
        cloudinary_habilitado=bool(
            settings.cloudinary_cloud_name
            and settings.cloudinary_api_key
            and settings.cloudinary_api_secret
        ),
    )
