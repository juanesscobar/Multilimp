from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import create_db_and_tables
from app.config import settings
from app.routers import auth, categorias, productos, catalogo, ventas, stock, dashboard, config_publica


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title=f"{settings.nombre_negocio} — API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(categorias.router, prefix="/categorias", tags=["Categorías"])
app.include_router(productos.router, prefix="/productos", tags=["Productos"])
app.include_router(catalogo.router, prefix="/catalogo", tags=["Catálogo Público"])
app.include_router(ventas.router, prefix="/ventas", tags=["Ventas"])
app.include_router(stock.router, prefix="/stock", tags=["Stock"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(config_publica.router, prefix="/config", tags=["Configuración"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "negocio": settings.nombre_negocio}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
