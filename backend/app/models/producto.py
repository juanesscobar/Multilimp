from typing import Optional, List
from decimal import Decimal
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship, Column
import sqlalchemy as sa


class Producto(SQLModel, table=True):
    __tablename__ = "productos"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=200, index=True)
    descripcion: Optional[str] = Field(default=None)
    sku: Optional[str] = Field(default=None, unique=True, max_length=100, index=True)
    categoria_id: int = Field(foreign_key="categorias.id")
    precio_venta: Decimal = Field(sa_column=Column(sa.Numeric(10, 2), nullable=False))
    precio_costo: Optional[Decimal] = Field(
        default=None, sa_column=Column(sa.Numeric(10, 2), nullable=True)
    )
    stock_actual: int = Field(default=0)
    stock_minimo: int = Field(default=5)
    stop_venta: bool = Field(default=False)
    imagen_url: Optional[str] = Field(default=None)
    unidad_medida: str = Field(default="unidad", max_length=50)
    activo: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    categoria: Optional["Categoria"] = Relationship(back_populates="productos")
    items_venta: List["ItemVenta"] = Relationship(back_populates="producto")
    movimientos: List["MovimientoStock"] = Relationship(back_populates="producto")
