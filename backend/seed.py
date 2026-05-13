"""Script para poblar la base de datos con datos iniciales (admin user + categorías de ejemplo)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlmodel import Session, select
from app.database import engine, create_db_and_tables
from app.models import Categoria, Usuario, RolUsuario
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed():
    create_db_and_tables()
    with Session(engine) as session:
        # Usuario admin por defecto
        existing = session.exec(select(Usuario).where(Usuario.email == "admin@limpieza.com")).first()
        if not existing:
            admin = Usuario(
                nombre="Administrador",
                email="admin@limpieza.com",
                password_hash=pwd_context.hash("admin1234"),
                rol=RolUsuario.admin,
            )
            session.add(admin)
            print("✅ Usuario admin creado: admin@limpieza.com / admin1234")

        # Categorías base
        categorias = [
            "Desinfectantes",
            "Detergentes",
            "Lavavajillas",
            "Lavandina / Blanqueadores",
            "Limpiadores multiusos",
            "Productos para pisos",
            "Cuidado de ropa",
            "Insumos industriales",
        ]
        for nombre in categorias:
            exists = session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()
            if not exists:
                session.add(Categoria(nombre=nombre, descripcion=f"Categoría: {nombre}"))
                print(f"✅ Categoría creada: {nombre}")

        session.commit()
    print("\n✅ Seed completado.")


if __name__ == "__main__":
    seed()
