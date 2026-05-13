import math
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlmodel import Session, select, func

from app.database import get_session
from app.models.movimiento_stock import MovimientoStock, TipoMovimiento
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.utils.auth import get_current_user, require_admin

router = APIRouter()


# ── Schemas locales ───────────────────────────────────────────────────────────

class EntradaStockRequest(BaseModel):
    producto_id: int
    cantidad: int
    descripcion: Optional[str] = None


class AjusteStockRequest(BaseModel):
    producto_id: int
    stock_nuevo: int
    descripcion: Optional[str] = None


class MovimientoResponse(BaseModel):
    id: int
    producto_id: int
    producto_nombre: str = ""
    tipo: TipoMovimiento
    cantidad: int
    stock_anterior: int
    stock_nuevo: int
    referencia_id: Optional[int]
    descripcion: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertaStock(BaseModel):
    producto_id: int
    nombre: str
    sku: Optional[str]
    categoria: str
    stock_actual: int
    stock_minimo: int
    diferencia: int


class PaginatedMovimientos(BaseModel):
    total: int
    page: int
    limit: int
    pages: int
    items: list[MovimientoResponse]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/movimientos", response_model=PaginatedMovimientos)
def historial_movimientos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    producto_id: Optional[int] = None,
    tipo: Optional[TipoMovimiento] = None,
    session: Session = Depends(get_session),
    _: Usuario = Depends(get_current_user),
):
    query = select(MovimientoStock)
    count_q = select(func.count(MovimientoStock.id))

    if producto_id is not None:
        query = query.where(MovimientoStock.producto_id == producto_id)
        count_q = count_q.where(MovimientoStock.producto_id == producto_id)
    if tipo is not None:
        query = query.where(MovimientoStock.tipo == tipo)
        count_q = count_q.where(MovimientoStock.tipo == tipo)

    total = session.exec(count_q).one()
    pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit

    movs = session.exec(
        query.order_by(MovimientoStock.created_at.desc()).offset(offset).limit(limit)
    ).all()

    items_out = []
    for m in movs:
        prod = session.get(Producto, m.producto_id)
        items_out.append(
            MovimientoResponse(
                id=m.id,
                producto_id=m.producto_id,
                producto_nombre=prod.nombre if prod else f"Producto #{m.producto_id}",
                tipo=m.tipo,
                cantidad=m.cantidad,
                stock_anterior=m.stock_anterior,
                stock_nuevo=m.stock_nuevo,
                referencia_id=m.referencia_id,
                descripcion=m.descripcion,
                created_at=m.created_at,
            )
        )

    return PaginatedMovimientos(total=total, page=page, limit=limit, pages=pages, items=items_out)


@router.post("/entrada", status_code=status.HTTP_201_CREATED)
def registrar_entrada(
    data: EntradaStockRequest,
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    """Registra una entrada de mercadería y actualiza el stock."""
    if data.cantidad <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La cantidad debe ser mayor a 0")

    producto = session.get(Producto, data.producto_id)
    if not producto or not producto.activo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    stock_anterior = producto.stock_actual
    producto.stock_actual += data.cantidad
    producto.updated_at = datetime.now(timezone.utc)
    session.add(producto)

    mov = MovimientoStock(
        producto_id=producto.id,
        tipo=TipoMovimiento.entrada,
        cantidad=data.cantidad,
        stock_anterior=stock_anterior,
        stock_nuevo=producto.stock_actual,
        descripcion=data.descripcion or "Entrada de mercadería",
    )
    session.add(mov)
    session.commit()
    session.refresh(producto)

    return {
        "mensaje": "Entrada registrada",
        "producto": producto.nombre,
        "stock_anterior": stock_anterior,
        "stock_nuevo": producto.stock_actual,
    }


@router.post("/ajuste", status_code=status.HTTP_201_CREATED)
def ajuste_manual(
    data: AjusteStockRequest,
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    """Ajuste manual: establece el stock a un valor específico."""
    if data.stock_nuevo < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El stock no puede ser negativo")

    producto = session.get(Producto, data.producto_id)
    if not producto or not producto.activo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    stock_anterior = producto.stock_actual
    diferencia = data.stock_nuevo - stock_anterior
    producto.stock_actual = data.stock_nuevo
    producto.updated_at = datetime.now(timezone.utc)
    session.add(producto)

    mov = MovimientoStock(
        producto_id=producto.id,
        tipo=TipoMovimiento.ajuste,
        cantidad=diferencia,
        stock_anterior=stock_anterior,
        stock_nuevo=data.stock_nuevo,
        descripcion=data.descripcion or "Ajuste manual de stock",
    )
    session.add(mov)
    session.commit()

    return {
        "mensaje": "Ajuste registrado",
        "producto": producto.nombre,
        "stock_anterior": stock_anterior,
        "stock_nuevo": data.stock_nuevo,
        "diferencia": diferencia,
    }


@router.get("/alertas", response_model=list[AlertaStock])
def alertas_stock(
    session: Session = Depends(get_session),
    _: Usuario = Depends(get_current_user),
):
    """Retorna productos con stock_actual <= stock_minimo."""
    productos = session.exec(
        select(Producto)
        .where(Producto.activo == True)
        .where(Producto.stock_actual <= Producto.stock_minimo)
        .order_by(Producto.stock_actual)
    ).all()

    alertas = []
    for p in productos:
        cat = p.categoria
        alertas.append(
            AlertaStock(
                producto_id=p.id,
                nombre=p.nombre,
                sku=p.sku,
                categoria=cat.nombre if cat else "Sin categoría",
                stock_actual=p.stock_actual,
                stock_minimo=p.stock_minimo,
                diferencia=p.stock_minimo - p.stock_actual,
            )
        )
    return alertas
