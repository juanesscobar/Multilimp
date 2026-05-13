from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timezone

from app.database import get_session
from app.models.usuario import Usuario, RolUsuario
from app.schemas.auth import LoginRequest, TokenResponse, UsuarioResponse, UsuarioCreate, UsuarioUpdate
from app.utils.auth import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_user,
    require_admin,
)

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, session: Session = Depends(get_session)):
    """Autenticar usuario y retornar JWT."""
    user = session.exec(select(Usuario).where(Usuario.email == credentials.email)).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    if not user.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta desactivada")

    token = create_access_token({"sub": str(user.id), "rol": user.rol})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UsuarioResponse)
def me(current_user: Usuario = Depends(get_current_user)):
    """Retorna datos del usuario autenticado."""
    return current_user


@router.get("/usuarios", response_model=list[UsuarioResponse])
def listar_usuarios(
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    """Lista todos los usuarios (solo admin)."""
    return session.exec(select(Usuario)).all()


@router.post("/usuarios", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario(
    data: UsuarioCreate,
    session: Session = Depends(get_session),
    _: Usuario = Depends(require_admin),
):
    """Crear nuevo usuario (solo admin)."""
    existing = session.exec(select(Usuario).where(Usuario.email == data.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")

    user = Usuario(
        nombre=data.nombre,
        email=data.email,
        password_hash=hash_password(data.password),
        rol=data.rol,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.put("/usuarios/{user_id}", response_model=UsuarioResponse)
def actualizar_usuario(
    user_id: int,
    data: UsuarioUpdate,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(require_admin),
):
    """Actualizar usuario (solo admin)."""
    user = session.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    if data.nombre is not None:
        user.nombre = data.nombre
    if data.email is not None:
        user.email = data.email
    if data.password is not None:
        user.password_hash = hash_password(data.password)
    if data.rol is not None:
        user.rol = data.rol
    if data.activo is not None:
        user.activo = data.activo

    user.updated_at = datetime.now(timezone.utc)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.delete("/usuarios/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_usuario(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(require_admin),
):
    """Desactivar usuario (soft delete, solo admin)."""
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes desactivarte a ti mismo")

    user = session.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    user.activo = False
    user.updated_at = datetime.now(timezone.utc)
    session.add(user)
    session.commit()
