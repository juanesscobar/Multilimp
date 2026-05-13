import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, status, UploadFile

from app.config import settings

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 5
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024


def _configure():
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def _cloudinary_habilitado() -> bool:
    return bool(
        settings.cloudinary_cloud_name
        and settings.cloudinary_api_key
        and settings.cloudinary_api_secret
    )


async def subir_imagen_producto(file: UploadFile, producto_id: int) -> str:
    """
    Sube una imagen a Cloudinary en la carpeta 'productos/'.
    Retorna la URL segura de la imagen.
    Lanza HTTPException si Cloudinary no está configurado o falla el upload.
    """
    if not _cloudinary_habilitado():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary no configurado. Agregue las variables CLOUDINARY_* en .env",
        )

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no permitido: {file.content_type}. Use JPEG, PNG o WebP.",
        )

    contenido = await file.read()
    if len(contenido) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El archivo supera el límite de {MAX_SIZE_MB} MB.",
        )

    _configure()

    try:
        resultado = cloudinary.uploader.upload(
            contenido,
            folder="productos",
            public_id=f"producto_{producto_id}",
            overwrite=True,
            resource_type="image",
            transformation=[
                {"width": 800, "height": 800, "crop": "limit", "quality": "auto", "fetch_format": "auto"}
            ],
        )
        return resultado["secure_url"]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error al subir imagen: {str(e)}",
        )


async def eliminar_imagen_producto(producto_id: int) -> bool:
    """Elimina la imagen de un producto en Cloudinary. Retorna True si fue exitoso."""
    if not _cloudinary_habilitado():
        return False
    _configure()
    try:
        resultado = cloudinary.uploader.destroy(f"productos/producto_{producto_id}")
        return resultado.get("result") == "ok"
    except Exception:
        return False


async def subir_imagen_generica(file: UploadFile, carpeta: str = "uploads", public_id: str = None) -> str:
    """Upload genérico para cualquier imagen. Retorna URL segura."""
    if not _cloudinary_habilitado():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary no configurado.",
        )

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no permitido: {file.content_type}",
        )

    contenido = await file.read()
    if len(contenido) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El archivo supera el límite de {MAX_SIZE_MB} MB.",
        )

    _configure()
    upload_opts = {
        "folder": carpeta,
        "overwrite": True,
        "resource_type": "image",
        "transformation": [
            {"quality": "auto", "fetch_format": "auto"}
        ],
    }
    if public_id:
        upload_opts["public_id"] = public_id

    try:
        resultado = cloudinary.uploader.upload(contenido, **upload_opts)
        return resultado["secure_url"]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error al subir imagen: {str(e)}",
        )
