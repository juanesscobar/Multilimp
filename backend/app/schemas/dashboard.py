from decimal import Decimal
from pydantic import BaseModel


class StatsVentas(BaseModel):
    hoy: Decimal
    semana: Decimal
    mes: Decimal
    hoy_cantidad: int
    semana_cantidad: int
    mes_cantidad: int


class StatsProductos(BaseModel):
    total_activos: int
    sin_stock: int
    stock_bajo: int
    con_stop_venta: int


class DashboardStats(BaseModel):
    ventas: StatsVentas
    productos: StatsProductos


class VentaPorDia(BaseModel):
    fecha: str
    total: Decimal
    cantidad: int


class TopProducto(BaseModel):
    producto_id: int
    nombre: str
    categoria: str
    unidades_vendidas: int
    total_vendido: Decimal
