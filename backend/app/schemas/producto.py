from typing import Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, field_validator


# ── Categoría ────────────────────────────────────────────────────────────────

class CategoriaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True


class CategoriaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None


class CategoriaResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    activo: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CategoriaSimple(BaseModel):
    id: int
    nombre: str

    model_config = {"from_attributes": True}


# ── Producto ──────────────────────────────────────────────────────────────────

class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    sku: Optional[str] = None
    categoria_id: int
    precio_venta: Decimal
    precio_costo: Optional[Decimal] = None
    stock_actual: int = 0
    stock_minimo: int = 5
    stop_venta: bool = False
    imagen_url: Optional[str] = None
    unidad_medida: str = "unidad"
    activo: bool = True

    @field_validator("precio_venta")
    @classmethod
    def precio_positivo(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("El precio debe ser mayor o igual a 0")
        return v


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    sku: Optional[str] = None
    categoria_id: Optional[int] = None
    precio_venta: Optional[Decimal] = None
    precio_costo: Optional[Decimal] = None
    stock_actual: Optional[int] = None
    stock_minimo: Optional[int] = None
    stop_venta: Optional[bool] = None
    imagen_url: Optional[str] = None
    unidad_medida: Optional[str] = None
    activo: Optional[bool] = None


class ProductoResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    sku: Optional[str]
    categoria_id: int
    categoria: Optional[CategoriaSimple]
    precio_venta: Decimal
    precio_costo: Optional[Decimal]
    stock_actual: int
    stock_minimo: int
    stop_venta: bool
    imagen_url: Optional[str]
    unidad_medida: str
    activo: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductoPublico(BaseModel):
    """Schema para el catálogo público — sin precio_costo."""
    id: int
    nombre: str
    descripcion: Optional[str]
    sku: Optional[str]
    categoria: Optional[CategoriaSimple]
    precio_venta: Decimal
    stock_actual: int
    stop_venta: bool
    imagen_url: Optional[str]
    unidad_medida: str

    model_config = {"from_attributes": True}


# ── Paginación ────────────────────────────────────────────────────────────────

class PaginatedProductos(BaseModel):
    total: int
    page: int
    limit: int
    pages: int
    items: list[ProductoResponse]


class PaginatedProductosPublico(BaseModel):
    total: int
    page: int
    limit: int
    pages: int
    items: list[ProductoPublico]


# ── CSV import ────────────────────────────────────────────────────────────────

class ImportCSVResult(BaseModel):
    creados: int
    actualizados: int
    errores: list[dict]
