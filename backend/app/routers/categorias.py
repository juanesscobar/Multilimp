from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.categoria import Categoria
from app.models.usuario import Usuario
from app.schemas.producto import CategoriaCreate, CategoriaUpdate, CategoriaResponse
from app.utils.auth import get_current_user, require_admin

router = APIRouter()


@router.get("", response_model=list[CategoriaResponse])
def listar_categorias(
    activo: bool | None = None,
    session: Session = Depends(get_session),
):
    """Lista categorías. Filtro opcional por activo."""
    query = select(Categoria)
    if activo is not None:
        query = query.where(Categoria.activo == activo)
    return session.exec(query.order_by(Categoria.nombre)).all()


@router.get("/{categoria_id}", response_model=CategoriaResponse)
def obtener_categoria(categoria_id: int, session: Session = Depends(get_session)):
    cat = session.get(Categoria, categoria_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    return cat


@router.post("", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
def crear_categoria(
    data: CategoriaCreate,
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    existing = session.exec(select(Categoria).where(Categoria.nombre == data.nombre)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una categoría con ese nombre")

    cat = Categoria(**data.model_dump())
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return cat


@router.put("/{categoria_id}", response_model=CategoriaResponse)
def actualizar_categoria(
    categoria_id: int,
    data: CategoriaUpdate,
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    cat = session.get(Categoria, categoria_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")

    if data.nombre is not None:
        dup = session.exec(
            select(Categoria).where(Categoria.nombre == data.nombre, Categoria.id != categoria_id)
        ).first()
        if dup:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una categoría con ese nombre")
        cat.nombre = data.nombre
    if data.descripcion is not None:
        cat.descripcion = data.descripcion
    if data.activo is not None:
        cat.activo = data.activo

    cat.updated_at = datetime.now(timezone.utc)
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return cat


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_categoria(
    categoria_id: int,
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    cat = session.get(Categoria, categoria_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    cat.activo = False
    cat.updated_at = datetime.now(timezone.utc)
    session.add(cat)
    session.commit()
