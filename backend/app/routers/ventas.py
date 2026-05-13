import math
from datetime import datetime, timezone, date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func

from app.database import get_session
from app.models.item_venta import ItemVenta
from app.models.movimiento_stock import MovimientoStock, TipoMovimiento
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.models.venta import EstadoVenta, MetodoPago, OrigenVenta, Venta
from app.schemas.venta import (
    ComprobanteResponse,
    ItemVentaResponse,
    PaginatedVentas,
    VentaCreate,
    VentaEstadoUpdate,
    VentaResponse,
)
from app.utils.auth import get_current_user
from app.utils.whatsapp import generar_link_whatsapp
from app.config import settings

router = APIRouter()


def _generar_numero_venta(session: Session) -> str:
    anio = datetime.now(timezone.utc).year
    ultimo = session.exec(
        select(Venta)
        .where(Venta.numero_venta.startswith(f"V-{anio}-"))
        .order_by(Venta.id.desc())
    ).first()
    if ultimo:
        try:
            seq = int(ultimo.numero_venta.split("-")[-1]) + 1
        except ValueError:
            seq = 1
    else:
        seq = 1
    return f"V-{anio}-{seq:04d}"


def _build_response(venta: Venta, session: Session) -> VentaResponse:
    items_db = session.exec(select(ItemVenta).where(ItemVenta.venta_id == venta.id)).all()
    items_out = []
    for it in items_db:
        prod = session.get(Producto, it.producto_id)
        items_out.append(
            ItemVentaResponse(
                id=it.id,
                producto_id=it.producto_id,
                producto_nombre=prod.nombre if prod else "",
                cantidad=it.cantidad,
                precio_unitario=it.precio_unitario,
                subtotal=it.subtotal,
            )
        )
    data = VentaResponse.model_validate(venta)
    data.items = items_out
    return data


@router.get("", response_model=PaginatedVentas)
def listar_ventas(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    estado: Optional[EstadoVenta] = None,
    metodo_pago: Optional[MetodoPago] = None,
    origen: Optional[OrigenVenta] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    session: Session = Depends(get_session),
    _: Usuario = Depends(get_current_user),
):
    query = select(Venta)
    count_q = select(func.count(Venta.id))

    if estado:
        query = query.where(Venta.estado == estado)
        count_q = count_q.where(Venta.estado == estado)
    if metodo_pago:
        query = query.where(Venta.metodo_pago == metodo_pago)
        count_q = count_q.where(Venta.metodo_pago == metodo_pago)
    if origen:
        query = query.where(Venta.origen == origen)
        count_q = count_q.where(Venta.origen == origen)
    if fecha_desde:
        dt_desde = datetime.combine(fecha_desde, datetime.min.time()).replace(tzinfo=timezone.utc)
        query = query.where(Venta.created_at >= dt_desde)
        count_q = count_q.where(Venta.created_at >= dt_desde)
    if fecha_hasta:
        dt_hasta = datetime.combine(fecha_hasta, datetime.max.time()).replace(tzinfo=timezone.utc)
        query = query.where(Venta.created_at <= dt_hasta)
        count_q = count_q.where(Venta.created_at <= dt_hasta)

    total = session.exec(count_q).one()
    pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit

    ventas = session.exec(query.order_by(Venta.created_at.desc()).offset(offset).limit(limit)).all()
    items_out = [_build_response(v, session) for v in ventas]

    return PaginatedVentas(total=total, page=page, limit=limit, pages=pages, items=items_out)


@router.get("/{venta_id}", response_model=VentaResponse)
def obtener_venta(
    venta_id: int,
    session: Session = Depends(get_session),
    _: Usuario = Depends(get_current_user),
):
    venta = session.get(Venta, venta_id)
    if not venta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
    return _build_response(venta, session)


@router.post("", response_model=VentaResponse, status_code=status.HTTP_201_CREATED)
def crear_venta(data: VentaCreate, session: Session = Depends(get_session)):
    """Crear venta — disponible para admin y catálogo público (sin auth)."""
    subtotal = Decimal("0")
    items_preparados = []

    for item_in in data.items:
        producto = session.get(Producto, item_in.producto_id)
        if not producto or not producto.activo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Producto ID {item_in.producto_id} no encontrado",
            )
        if producto.stop_venta:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{producto.nombre}' no está disponible para venta",
            )
        if producto.stock_actual < item_in.cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente para '{producto.nombre}'. Disponible: {producto.stock_actual}",
            )
        linea = item_in.cantidad * producto.precio_venta
        subtotal += linea
        items_preparados.append((producto, item_in.cantidad, producto.precio_venta, linea))

    descuento = data.descuento or Decimal("0")
    total = subtotal - descuento

    venta = Venta(
        numero_venta=_generar_numero_venta(session),
        cliente_nombre=data.cliente_nombre,
        cliente_telefono=data.cliente_telefono,
        metodo_pago=data.metodo_pago,
        estado=EstadoVenta.pendiente,
        subtotal=subtotal,
        descuento=descuento,
        total=total,
        notas=data.notas,
        origen=data.origen,
    )
    session.add(venta)
    session.flush()

    for producto, cantidad, precio_u, sub in items_preparados:
        item = ItemVenta(
            venta_id=venta.id,
            producto_id=producto.id,
            cantidad=cantidad,
            precio_unitario=precio_u,
            subtotal=sub,
        )
        session.add(item)

        stock_anterior = producto.stock_actual
        producto.stock_actual -= cantidad
        producto.updated_at = datetime.now(timezone.utc)
        session.add(producto)

        mov = MovimientoStock(
            producto_id=producto.id,
            tipo=TipoMovimiento.venta,
            cantidad=-cantidad,
            stock_anterior=stock_anterior,
            stock_nuevo=producto.stock_actual,
            referencia_id=venta.id,
            descripcion=f"Venta {venta.numero_venta}",
        )
        session.add(mov)

    session.commit()
    session.refresh(venta)
    return _build_response(venta, session)


@router.patch("/{venta_id}/estado", response_model=VentaResponse)
def cambiar_estado(
    venta_id: int,
    data: VentaEstadoUpdate,
    session: Session = Depends(get_session),
    _: Usuario = Depends(get_current_user),
):
    venta = session.get(Venta, venta_id)
    if not venta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")

    # Si se cancela, devolver stock
    if data.estado == EstadoVenta.cancelado and venta.estado != EstadoVenta.cancelado:
        items_db = session.exec(select(ItemVenta).where(ItemVenta.venta_id == venta.id)).all()
        for it in items_db:
            producto = session.get(Producto, it.producto_id)
            if producto:
                stock_anterior = producto.stock_actual
                producto.stock_actual += it.cantidad
                producto.updated_at = datetime.now(timezone.utc)
                session.add(producto)
                mov = MovimientoStock(
                    producto_id=producto.id,
                    tipo=TipoMovimiento.devolucion,
                    cantidad=it.cantidad,
                    stock_anterior=stock_anterior,
                    stock_nuevo=producto.stock_actual,
                    referencia_id=venta.id,
                    descripcion=f"Devolución por cancelación {venta.numero_venta}",
                )
                session.add(mov)

    venta.estado = data.estado
    venta.updated_at = datetime.now(timezone.utc)
    session.add(venta)
    session.commit()
    session.refresh(venta)
    return _build_response(venta, session)


@router.get("/{venta_id}/comprobante", response_model=ComprobanteResponse)
def obtener_comprobante(
    venta_id: int,
    session: Session = Depends(get_session),
):
    """Genera el comprobante con link de WhatsApp. Sin auth (acceso desde catálogo)."""
    venta = session.get(Venta, venta_id)
    if not venta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")

    items_db = session.exec(select(ItemVenta).where(ItemVenta.venta_id == venta.id)).all()
    items_resp = []
    items_detalle = []
    for it in items_db:
        prod = session.get(Producto, it.producto_id)
        nombre = prod.nombre if prod else f"Producto #{it.producto_id}"
        items_resp.append(
            ItemVentaResponse(
                id=it.id,
                producto_id=it.producto_id,
                producto_nombre=nombre,
                cantidad=it.cantidad,
                precio_unitario=it.precio_unitario,
                subtotal=it.subtotal,
            )
        )
        items_detalle.append(
            {"nombre": nombre, "cantidad": it.cantidad,
             "precio_unitario": it.precio_unitario, "subtotal": it.subtotal}
        )

    alias = settings.alias_pago if venta.metodo_pago in ("alias", "transferencia") else None
    fecha_str = venta.created_at.strftime("%d/%m/%Y %H:%M")
    wa_link = generar_link_whatsapp(venta, items_detalle)

    return ComprobanteResponse(
        numero_venta=venta.numero_venta,
        fecha=fecha_str,
        cliente_nombre=venta.cliente_nombre,
        cliente_telefono=venta.cliente_telefono,
        metodo_pago=venta.metodo_pago,
        alias_pago=alias,
        items=items_resp,
        subtotal=venta.subtotal,
        descuento=venta.descuento,
        total=venta.total,
        whatsapp_link=wa_link,
    )
