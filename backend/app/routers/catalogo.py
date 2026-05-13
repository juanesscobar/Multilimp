import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func

from app.database import get_session
from app.models.categoria import Categoria
from app.models.producto import Producto
from app.schemas.producto import (
    CategoriaResponse,
    ProductoPublico,
    PaginatedProductosPublico,
)

router = APIRouter()


@router.get("/categorias", response_model=list[CategoriaResponse])
def categorias_publicas(session: Session = Depends(get_session)):
    """Categorías activas para el catálogo público."""
    return session.exec(
        select(Categoria).where(Categoria.activo == True).order_by(Categoria.nombre)
    ).all()


@router.get("/productos", response_model=PaginatedProductosPublico)
def productos_publicos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    categoria_id: Optional[int] = None,
    session: Session = Depends(get_session),
):
    """
    Catálogo público: solo productos activos, sin stop_venta y con stock > 0.
    No requiere autenticación.
    """
    base = (
        select(Producto)
        .where(Producto.activo == True)
        .where(Producto.stop_venta == False)
        .where(Producto.stock_actual > 0)
    )
    count_base = (
        select(func.count(Producto.id))
        .where(Producto.activo == True)
        .where(Producto.stop_venta == False)
        .where(Producto.stock_actual > 0)
    )

    if categoria_id is not None:
        base = base.where(Producto.categoria_id == categoria_id)
        count_base = count_base.where(Producto.categoria_id == categoria_id)
    if search:
        term = f"%{search}%"
        base = base.where(Producto.nombre.ilike(term))
        count_base = count_base.where(Producto.nombre.ilike(term))

    total = session.exec(count_base).one()
    pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit

    items = session.exec(base.order_by(Producto.nombre).offset(offset).limit(limit)).all()

    return PaginatedProductosPublico(total=total, page=page, limit=limit, pages=pages, items=items)
