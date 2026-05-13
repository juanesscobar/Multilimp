import csv
import io
import math
from decimal import Decimal, InvalidOperation
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlmodel import Session, select, func

from app.database import get_session
from app.models.categoria import Categoria
from app.models.producto import Producto
from app.models.movimiento_stock import MovimientoStock, TipoMovimiento
from app.models.usuario import Usuario
from app.schemas.producto import (
    ProductoCreate,
    ProductoUpdate,
    ProductoResponse,
    PaginatedProductos,
    ImportCSVResult,
)
from app.utils.auth import get_current_user, require_admin
from app.utils.cloudinary import subir_imagen_producto, eliminar_imagen_producto

router = APIRouter()


def _get_or_404(session: Session, producto_id: int) -> Producto:
    p = session.get(Producto, producto_id)
    if not p or not p.activo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return p


@router.get("", response_model=PaginatedProductos)
def listar_productos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    categoria_id: Optional[int] = None,
    stop_venta: Optional[bool] = None,
    activo: Optional[bool] = True,
    session: Session = Depends(get_session),
    _: Usuario = Depends(get_current_user),
):
    """Lista paginada de productos (admin). Soporta filtros por categoría, stop_venta, activo y búsqueda."""
    query = select(Producto)
    count_query = select(func.count(Producto.id))

    if activo is not None:
        query = query.where(Producto.activo == activo)
        count_query = count_query.where(Producto.activo == activo)
    if stop_venta is not None:
        query = query.where(Producto.stop_venta == stop_venta)
        count_query = count_query.where(Producto.stop_venta == stop_venta)
    if categoria_id is not None:
        query = query.where(Producto.categoria_id == categoria_id)
        count_query = count_query.where(Producto.categoria_id == categoria_id)
    if search:
        term = f"%{search}%"
        query = query.where(Producto.nombre.ilike(term) | Producto.sku.ilike(term))
        count_query = count_query.where(Producto.nombre.ilike(term) | Producto.sku.ilike(term))

    total = session.exec(count_query).one()
    pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit

    items = session.exec(query.order_by(Producto.nombre).offset(offset).limit(limit)).all()

    return PaginatedProductos(total=total, page=page, limit=limit, pages=pages, items=items)


@router.get("/{producto_id}", response_model=ProductoResponse)
def obtener_producto(
    producto_id: int,
    session: Session = Depends(get_session),
    _: Usuario = Depends(get_current_user),
):
    return _get_or_404(session, producto_id)


@router.post("", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def crear_producto(
    data: ProductoCreate,
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    cat = session.get(Categoria, data.categoria_id)
    if not cat or not cat.activo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Categoría no encontrada o inactiva")

    if data.sku:
        dup = session.exec(select(Producto).where(Producto.sku == data.sku)).first()
        if dup:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU ya registrado")

    producto = Producto(**data.model_dump())
    session.add(producto)
    session.commit()
    session.refresh(producto)

    # Registrar movimiento inicial si tiene stock
    if producto.stock_actual > 0:
        mov = MovimientoStock(
            producto_id=producto.id,
            tipo=TipoMovimiento.entrada,
            cantidad=producto.stock_actual,
            stock_anterior=0,
            stock_nuevo=producto.stock_actual,
            descripcion="Stock inicial al crear producto",
        )
        session.add(mov)
        session.commit()

    return producto


@router.put("/{producto_id}", response_model=ProductoResponse)
def actualizar_producto(
    producto_id: int,
    data: ProductoUpdate,
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    producto = _get_or_404(session, producto_id)

    if data.categoria_id is not None:
        cat = session.get(Categoria, data.categoria_id)
        if not cat or not cat.activo:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Categoría no encontrada o inactiva")

    if data.sku is not None and data.sku != producto.sku:
        dup = session.exec(
            select(Producto).where(Producto.sku == data.sku, Producto.id != producto_id)
        ).first()
        if dup:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU ya registrado")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(producto, key, value)

    producto.updated_at = datetime.now(timezone.utc)
    session.add(producto)
    session.commit()
    session.refresh(producto)
    return producto


@router.patch("/{producto_id}/stop-venta", response_model=ProductoResponse)
def toggle_stop_venta(
    producto_id: int,
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    """Toggle inmediato de stop de venta. Sin confirmar."""
    producto = _get_or_404(session, producto_id)
    producto.stop_venta = not producto.stop_venta
    producto.updated_at = datetime.now(timezone.utc)
    session.add(producto)
    session.commit()
    session.refresh(producto)
    return producto


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_producto(
    producto_id: int,
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    """Soft delete — marca activo=False."""
    producto = _get_or_404(session, producto_id)
    producto.activo = False
    producto.updated_at = datetime.now(timezone.utc)
    session.add(producto)
    session.commit()


@router.post("/{producto_id}/imagen", response_model=ProductoResponse)
async def subir_imagen(
    producto_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    """Sube una imagen a Cloudinary y actualiza imagen_url del producto."""
    producto = _get_or_404(session, producto_id)
    url = await subir_imagen_producto(file, producto_id)
    producto.imagen_url = url
    producto.updated_at = datetime.now(timezone.utc)
    session.add(producto)
    session.commit()
    session.refresh(producto)
    return producto


@router.delete("/{producto_id}/imagen", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_imagen(
    producto_id: int,
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    """Elimina la imagen de Cloudinary y limpia imagen_url del producto."""
    producto = _get_or_404(session, producto_id)
    await eliminar_imagen_producto(producto_id)
    producto.imagen_url = None
    producto.updated_at = datetime.now(timezone.utc)
    session.add(producto)
    session.commit()


@router.post("/importar-csv", response_model=ImportCSVResult)
async def importar_csv(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    """
    Importa productos desde CSV.
    Columnas: nombre, descripcion, categoria, precio_venta, precio_costo,
              stock_actual, stock_minimo, sku, unidad_medida
    Crea categorías automáticamente si no existen.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo debe ser .csv")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # utf-8-sig maneja BOM de Excel
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    required_cols = {"nombre", "categoria", "precio_venta"}
    if not required_cols.issubset(set(reader.fieldnames or [])):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Columnas requeridas: {', '.join(required_cols)}",
        )

    creados = 0
    actualizados = 0
    errores: list[dict] = []

    for fila_num, row in enumerate(reader, start=2):
        nombre = row.get("nombre", "").strip()
        if not nombre:
            errores.append({"fila": fila_num, "motivo": "Nombre vacío"})
            continue

        # Precio venta obligatorio
        try:
            precio_venta = Decimal(str(row.get("precio_venta", "0")).strip().replace(",", "."))
        except InvalidOperation:
            errores.append({"fila": fila_num, "motivo": "precio_venta inválido"})
            continue

        # Precio costo opcional
        precio_costo = None
        raw_costo = row.get("precio_costo", "").strip()
        if raw_costo:
            try:
                precio_costo = Decimal(raw_costo.replace(",", "."))
            except InvalidOperation:
                errores.append({"fila": fila_num, "motivo": "precio_costo inválido"})
                continue

        # Categoría — crear si no existe
        cat_nombre = row.get("categoria", "General").strip() or "General"
        categoria = session.exec(select(Categoria).where(Categoria.nombre == cat_nombre)).first()
        if not categoria:
            categoria = Categoria(nombre=cat_nombre)
            session.add(categoria)
            session.flush()

        # Stock
        try:
            stock_actual = int(row.get("stock_actual", "0").strip() or 0)
            stock_minimo = int(row.get("stock_minimo", "5").strip() or 5)
        except ValueError:
            errores.append({"fila": fila_num, "motivo": "stock_actual o stock_minimo inválido"})
            continue

        sku = row.get("sku", "").strip() or None
        unidad = row.get("unidad_medida", "unidad").strip() or "unidad"
        descripcion = row.get("descripcion", "").strip() or None

        # Buscar por SKU o nombre para actualizar
        existing = None
        if sku:
            existing = session.exec(select(Producto).where(Producto.sku == sku)).first()
        if not existing:
            existing = session.exec(
                select(Producto).where(Producto.nombre == nombre, Producto.activo == True)
            ).first()

        if existing:
            stock_anterior = existing.stock_actual
            existing.nombre = nombre
            existing.descripcion = descripcion
            existing.categoria_id = categoria.id
            existing.precio_venta = precio_venta
            existing.precio_costo = precio_costo
            existing.stock_actual = stock_actual
            existing.stock_minimo = stock_minimo
            existing.unidad_medida = unidad
            existing.activo = True
            existing.updated_at = datetime.now(timezone.utc)
            session.add(existing)
            session.flush()

            if stock_actual != stock_anterior:
                mov = MovimientoStock(
                    producto_id=existing.id,
                    tipo=TipoMovimiento.ajuste,
                    cantidad=stock_actual - stock_anterior,
                    stock_anterior=stock_anterior,
                    stock_nuevo=stock_actual,
                    descripcion=f"Ajuste por importación CSV (fila {fila_num})",
                )
                session.add(mov)

            actualizados += 1
        else:
            producto = Producto(
                nombre=nombre,
                descripcion=descripcion,
                sku=sku,
                categoria_id=categoria.id,
                precio_venta=precio_venta,
                precio_costo=precio_costo,
                stock_actual=stock_actual,
                stock_minimo=stock_minimo,
                unidad_medida=unidad,
            )
            session.add(producto)
            session.flush()

            if stock_actual > 0:
                mov = MovimientoStock(
                    producto_id=producto.id,
                    tipo=TipoMovimiento.entrada,
                    cantidad=stock_actual,
                    stock_anterior=0,
                    stock_nuevo=stock_actual,
                    descripcion=f"Stock inicial por importación CSV (fila {fila_num})",
                )
                session.add(mov)

            creados += 1

    session.commit()
    return ImportCSVResult(creados=creados, actualizados=actualizados, errores=errores)
