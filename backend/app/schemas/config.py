from typing import Optional
from pydantic import BaseModel


class ConfigAdminResponse(BaseModel):
    nombre_negocio: str
    whatsapp_negocio: str
    alias_pago: str
    datos_transferencia: str
    nombre_banco: str
    nro_cuenta: str
    titular_cuenta: str


class ConfigAdminUpdate(BaseModel):
    nombre_negocio: Optional[str] = None
    whatsapp_negocio: Optional[str] = None
    alias_pago: Optional[str] = None
    datos_transferencia: Optional[str] = None
    nombre_banco: Optional[str] = None
    nro_cuenta: Optional[str] = None
    titular_cuenta: Optional[str] = None
