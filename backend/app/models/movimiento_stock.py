from typing import Optional
from datetime import datetime, timezone
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship


class TipoMovimiento(str, Enum):
    entrada = "entrada"
    venta = "venta"
    ajuste = "ajuste"
    devolucion = "devolucion"


class MovimientoStock(SQLModel, table=True):
    __tablename__ = "movimientos_stock"

    id: Optional[int] = Field(default=None, primary_key=True)
    producto_id: int = Field(foreign_key="productos.id", index=True)
    tipo: TipoMovimiento
    cantidad: int  # positivo = suma, negativo = resta
    stock_anterior: int
    stock_nuevo: int
    referencia_id: Optional[int] = Field(default=None)  # venta_id si aplica
    descripcion: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    producto: Optional["Producto"] = Relationship(back_populates="movimientos")
