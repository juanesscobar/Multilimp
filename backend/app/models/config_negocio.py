from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


class ConfigNegocio(SQLModel, table=True):
    __tablename__ = "config_negocio"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre_negocio: str = Field(default="MultiLimp")
    whatsapp_negocio: str = Field(default="")
    alias_pago: str = Field(default="")
    datos_transferencia: str = Field(default="")
    nombre_banco: str = Field(default="")
    nro_cuenta: str = Field(default="")
    titular_cuenta: str = Field(default="")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
