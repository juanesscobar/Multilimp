from datetime import datetime, timezone, timedelta, date
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func

from app.database import get_session
from app.models.item_venta import ItemVenta
from app.models.producto import Producto
from app.models.venta import Venta, EstadoVenta
from app.models.usuario import Usuario
from app.schemas.dashboard import DashboardStats, StatsVentas, StatsProductos, VentaPorDia, TopProducto
from app.utils.auth import get_current_user

router = APIRouter()


def _inicio_dia(dt: datetime) -> datetime:
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)


def _stats_ventas_periodo(session: Session, desde: datetime, hasta: datetime):
    """Retorna (total_gs, cantidad) de ventas confirmadas/pendientes en el período."""
    result = session.exec(
        select(func.coalesce(func.sum(Venta.total), 0), func.count(Venta.id))
        .where(Venta.created_at >= desde)
        .where(Venta.created_at <= hasta)
        .where(Venta.estado != EstadoVenta.cancelado)
    ).one()
    return Decimal(str(result[0])), int(result[1])


@router.get("/stats", response_model=DashboardStats)
def stats(
    session: Session = Depends(get_session),
    _: Usuario = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    hoy_inicio = _inicio_dia(now)
    semana_inicio = hoy_inicio - timedelta(days=now.weekday())
    mes_inicio = hoy_inicio.replace(day=1)

    total_hoy, cant_hoy = _stats_ventas_periodo(session, hoy_inicio, now)
    total_sem, cant_sem = _stats_ventas_periodo(session, semana_inicio, now)
    total_mes, cant_mes = _stats_ventas_periodo(session, mes_inicio, now)

    total_activos = session.exec(
        select(func.count(Producto.id)).where(Producto.activo == True)
    ).one()
    sin_stock = session.exec(
        select(func.count(Producto.id))
        .where(Producto.activo == True)
        .where(Producto.stock_actual == 0)
    ).one()
    stock_bajo = session.exec(
        select(func.count(Producto.id))
        .where(Producto.activo == True)
        .where(Producto.stock_actual <= Producto.stock_minimo)
        .where(Producto.stock_actual > 0)
    ).one()
    con_stop = session.exec(
        select(func.count(Producto.id))
        .where(Producto.activo == True)
        .where(Producto.stop_venta == True)
    ).one()

    return DashboardStats(
        ventas=StatsVentas(
            hoy=total_hoy,
            semana=total_sem,
            mes=total_mes,
            hoy_cantidad=cant_hoy,
            semana_cantidad=cant_sem,
            mes_cantidad=cant_mes,
        ),
        productos=StatsProductos(
            total_activos=total_activos,
            sin_stock=sin_stock,
            stock_bajo=stock_bajo,
            con_stop_venta=con_stop,
        ),
    )


@router.get("/ventas-por-dia", response_model=list[VentaPorDia])
def ventas_por_dia(
    dias: int = 30,
    session: Session = Depends(get_session),
    _: Usuario = Depends(get_current_user),
):
    """Ventas agrupadas por día — últimos N días (default 30). Para gráficos."""
    now = datetime.now(timezone.utc)
    desde = _inicio_dia(now) - timedelta(days=dias - 1)

    ventas = session.exec(
        select(Venta)
        .where(Venta.created_at >= desde)
        .where(Venta.estado != EstadoVenta.cancelado)
        .order_by(Venta.created_at)
    ).all()

    # Agrupar por fecha en Python (compatible con cualquier DB)
    por_dia: dict[date, dict] = {}
    for v in ventas:
        dia = v.created_at.date()
        if dia not in por_dia:
            por_dia[dia] = {"total": Decimal("0"), "cantidad": 0}
        por_dia[dia]["total"] += v.total
        por_dia[dia]["cantidad"] += 1

    # Rellenar días vacíos
    resultado = []
    for i in range(dias):
        dia = (desde + timedelta(days=i)).date()
        datos = por_dia.get(dia, {"total": Decimal("0"), "cantidad": 0})
        resultado.append(
            VentaPorDia(
                fecha=dia.strftime("%Y-%m-%d"),
                total=datos["total"],
                cantidad=datos["cantidad"],
            )
        )

    return resultado


@router.get("/top-productos", response_model=list[TopProducto])
def top_productos(
    limite: int = 10,
    dias: int = 30,
    session: Session = Depends(get_session),
    _: Usuario = Depends(get_current_user),
):
    """Top N productos más vendidos en los últimos N días."""
    now = datetime.now(timezone.utc)
    desde = _inicio_dia(now) - timedelta(days=dias - 1)

    # Obtener ventas no canceladas del período
    ventas_ids = [
        v.id for v in session.exec(
            select(Venta)
            .where(Venta.created_at >= desde)
            .where(Venta.estado != EstadoVenta.cancelado)
        ).all()
    ]

    if not ventas_ids:
        return []

    items = session.exec(
        select(ItemVenta).where(ItemVenta.venta_id.in_(ventas_ids))
    ).all()

    # Agrupar por producto
    acumulado: dict[int, dict] = {}
    for it in items:
        pid = it.producto_id
        if pid not in acumulado:
            acumulado[pid] = {"unidades": 0, "total": Decimal("0")}
        acumulado[pid]["unidades"] += it.cantidad
        acumulado[pid]["total"] += it.subtotal

    # Ordenar por unidades vendidas
    top = sorted(acumulado.items(), key=lambda x: x[1]["unidades"], reverse=True)[:limite]

    resultado = []
    for pid, datos in top:
        prod = session.get(Producto, pid)
        if prod:
            cat = prod.categoria
            resultado.append(
                TopProducto(
                    producto_id=pid,
                    nombre=prod.nombre,
                    categoria=cat.nombre if cat else "Sin categoría",
                    unidades_vendidas=datos["unidades"],
                    total_vendido=datos["total"],
                )
            )

    return resultado
