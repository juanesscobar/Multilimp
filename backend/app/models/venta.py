from typing import Optional, List
from decimal import Decimal
from datetime import datetime, timezone
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship, Column
import sqlalchemy as sa


class MetodoPago(str, Enum):
    efectivo = "efectivo"
    transferencia = "transferencia"
    alias = "alias"
    otro = "otro"


class EstadoVenta(str, Enum):
    pendiente = "pendiente"
    confirmado = "confirmado"
    cancelado = "cancelado"


class OrigenVenta(str, Enum):
    admin = "admin"
    catalogo = "catalogo"


class Venta(SQLModel, table=True):
    __tablename__ = "ventas"

    id: Optional[int] = Field(default=None, primary_key=True)
    numero_venta: str = Field(unique=True, max_length=20, index=True)
    cliente_nombre: str = Field(max_length=200)
    cliente_telefono: Optional[str] = Field(default=None, max_length=30)
    metodo_pago: MetodoPago = Field(default=MetodoPago.efectivo)
    estado: EstadoVenta = Field(default=EstadoVenta.pendiente)
    subtotal: Decimal = Field(sa_column=Column(sa.Numeric(10, 2), nullable=False))
    descuento: Decimal = Field(
        default=Decimal("0"), sa_column=Column(sa.Numeric(10, 2), nullable=False, server_default="0")
    )
    total: Decimal = Field(sa_column=Column(sa.Numeric(10, 2), nullable=False))
    notas: Optional[str] = Field(default=None)
    origen: OrigenVenta = Field(default=OrigenVenta.catalogo)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    items: List["ItemVenta"] = Relationship(back_populates="venta")
