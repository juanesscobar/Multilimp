from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, field_validator

from app.models.venta import MetodoPago, EstadoVenta, OrigenVenta


# ── Item ──────────────────────────────────────────────────────────────────────

class ItemVentaCreate(BaseModel):
    producto_id: int
    cantidad: int

    @field_validator("cantidad")
    @classmethod
    def cantidad_positiva(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("La cantidad debe ser mayor a 0")
        return v


class ItemVentaResponse(BaseModel):
    id: int
    producto_id: int
    producto_nombre: str = ""
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal

    model_config = {"from_attributes": True}


# ── Venta ─────────────────────────────────────────────────────────────────────

class VentaCreate(BaseModel):
    cliente_nombre: str
    cliente_telefono: Optional[str] = None
    metodo_pago: MetodoPago = MetodoPago.efectivo
    descuento: Decimal = Decimal("0")
    notas: Optional[str] = None
    origen: OrigenVenta = OrigenVenta.catalogo
    items: list[ItemVentaCreate]

    @field_validator("items")
    @classmethod
    def items_no_vacios(cls, v: list) -> list:
        if not v:
            raise ValueError("La venta debe tener al menos un producto")
        return v


class VentaEstadoUpdate(BaseModel):
    estado: EstadoVenta


class VentaResponse(BaseModel):
    id: int
    numero_venta: str
    cliente_nombre: str
    cliente_telefono: Optional[str]
    metodo_pago: MetodoPago
    estado: EstadoVenta
    origen: OrigenVenta
    subtotal: Decimal
    descuento: Decimal
    total: Decimal
    notas: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: list[ItemVentaResponse] = []

    model_config = {"from_attributes": True}


class PaginatedVentas(BaseModel):
    total: int
    page: int
    limit: int
    pages: int
    items: list[VentaResponse]


# ── Comprobante ───────────────────────────────────────────────────────────────

class ComprobanteResponse(BaseModel):
    numero_venta: str
    fecha: str
    cliente_nombre: str
    cliente_telefono: Optional[str]
    metodo_pago: MetodoPago
    alias_pago: Optional[str]
    items: list[ItemVentaResponse]
    subtotal: Decimal
    descuento: Decimal
    total: Decimal
    whatsapp_link: str
