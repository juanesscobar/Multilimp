from typing import Optional
from decimal import Decimal
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship, Column
import sqlalchemy as sa


class ItemVenta(SQLModel, table=True):
    __tablename__ = "items_venta"

    id: Optional[int] = Field(default=None, primary_key=True)
    venta_id: int = Field(foreign_key="ventas.id", index=True)
    producto_id: int = Field(foreign_key="productos.id", index=True)
    cantidad: int = Field(gt=0)
    precio_unitario: Decimal = Field(sa_column=Column(sa.Numeric(10, 2), nullable=False))
    subtotal: Decimal = Field(sa_column=Column(sa.Numeric(10, 2), nullable=False))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    venta: Optional["Venta"] = Relationship(back_populates="items")
    producto: Optional["Producto"] = Relationship(back_populates="items_venta")
