from urllib.parse import quote
from datetime import datetime, timezone, timedelta

from app.config import settings


def _formato_gs(valor) -> str:
    """Formatea un número como Guaraníes sin decimales: Gs. 1.500.000"""
    try:
        entero = int(valor)
    except (TypeError, ValueError):
        entero = 0
    return f"Gs. {entero:,}".replace(",", ".")


def _fecha_py(dt: datetime) -> str:
    """Convierte UTC a Paraguay (UTC-4) y formatea dd/mm/yyyy HH:MM"""
    py_time = dt.astimezone(timezone(timedelta(hours=-4)))
    return py_time.strftime("%d/%m/%Y %H:%M")


def generar_link_whatsapp(venta, items_detalle: list[dict]) -> str:
    """
    Construye el mensaje del comprobante y retorna el link wa.me listo para abrir.

    items_detalle: lista de dicts con keys: nombre, cantidad, precio_unitario, subtotal
    """
    alias_linea = ""
    if venta.metodo_pago in ("alias", "transferencia") and settings.alias_pago:
        alias_linea = f"\n💳 *Alias/Nro:* {settings.alias_pago}"

    lineas_productos = "\n".join(
        f"  {item['cantidad']}x {item['nombre']} — {_formato_gs(item['precio_unitario'])}"
        f" = {_formato_gs(item['subtotal'])}"
        for item in items_detalle
    )

    descuento_linea = ""
    if venta.descuento and venta.descuento > 0:
        descuento_linea = f"\n💸 *Descuento:* -{_formato_gs(venta.descuento)}"

    mensaje = (
        f"🧴 *PEDIDO #{venta.numero_venta}*\n"
        f"📅 {_fecha_py(venta.created_at)}\n"
        f"\n"
        f"*Cliente:* {venta.cliente_nombre}\n"
        f"*Teléfono:* {venta.cliente_telefono or '-'}\n"
        f"\n"
        f"*PRODUCTOS:*\n"
        f"{lineas_productos}\n"
        f"\n"
        f"*Subtotal:* {_formato_gs(venta.subtotal)}"
        f"{descuento_linea}\n"
        f"*TOTAL:* {_formato_gs(venta.total)}\n"
        f"\n"
        f"*Método de pago:* {venta.metodo_pago.upper()}"
        f"{alias_linea}\n"
        f"\n"
        f"¡Gracias por su pedido! 🙏"
    )

    numero = settings.whatsapp_negocio.replace("+", "").replace(" ", "")
    return f"https://wa.me/{numero}?text={quote(mensaje)}"
