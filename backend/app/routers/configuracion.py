"""Configuración del negocio — solo admin."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.config import settings
from app.database import get_session
from app.models.config_negocio import ConfigNegocio
from app.models.usuario import Usuario
from app.schemas.config import ConfigAdminResponse, ConfigAdminUpdate
from app.utils.auth import require_admin

router = APIRouter()


def _get_or_create(session: Session) -> ConfigNegocio:
    config = session.exec(select(ConfigNegocio)).first()
    if not config:
        config = ConfigNegocio(
            nombre_negocio=settings.nombre_negocio,
            whatsapp_negocio=settings.whatsapp_negocio,
            alias_pago=settings.alias_pago,
        )
        session.add(config)
        session.commit()
        session.refresh(config)
    return config


@router.get("", response_model=ConfigAdminResponse)
def get_config(
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    """Devuelve la configuración actual del negocio."""
    c = _get_or_create(session)
    return ConfigAdminResponse(
        nombre_negocio=c.nombre_negocio,
        whatsapp_negocio=c.whatsapp_negocio,
        alias_pago=c.alias_pago,
        datos_transferencia=c.datos_transferencia,
        nombre_banco=c.nombre_banco,
        nro_cuenta=c.nro_cuenta,
        titular_cuenta=c.titular_cuenta,
    )


@router.put("", response_model=ConfigAdminResponse)
def update_config(
    update: ConfigAdminUpdate,
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    """Actualiza la configuración del negocio."""
    c = _get_or_create(session)
    for field, value in update.model_dump(exclude_none=True).items():
        setattr(c, field, value)
    c.updated_at = datetime.now(timezone.utc)
    session.add(c)
    session.commit()
    session.refresh(c)
    return ConfigAdminResponse(
        nombre_negocio=c.nombre_negocio,
        whatsapp_negocio=c.whatsapp_negocio,
        alias_pago=c.alias_pago,
        datos_transferencia=c.datos_transferencia,
        nombre_banco=c.nombre_banco,
        nro_cuenta=c.nro_cuenta,
        titular_cuenta=c.titular_cuenta,
    )
