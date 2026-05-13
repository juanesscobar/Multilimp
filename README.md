# MultiLimp — Sistema de Gestión

Sistema web full-stack para fabricación y distribución de productos de limpieza en Paraguay. Incluye panel administrativo, catálogo público para clientes y API REST completa.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.11 · FastAPI · SQLModel · PostgreSQL 16 · Alembic |
| Frontend | Next.js 14 (App Router) · Tailwind CSS · Recharts · Lucide |
| Imágenes | Cloudinary (free tier) |
| Auth | JWT · python-jose · bcrypt |
| Deploy | Railway · Docker |

---

## Funcionalidades

### Panel Admin (`/dashboard`, `/productos`, `/ventas`, `/stock`)
- Dashboard con métricas de ventas (hoy / semana / mes) y gráfico de barras 30 días
- CRUD completo de productos con imágenes en Cloudinary
- **Stop de venta**: toggle rojo/verde por producto — excluye del catálogo al instante
- Importación masiva de productos desde CSV con resumen de errores
- Registro de ventas manuales con buscador de productos
- Historial de movimientos de stock (entrada · venta · ajuste · devolución)
- Alertas de stock bajo con badge en el sidebar
- Gestión de usuarios admin/operador

### Catálogo Público (`/`)
- Hero con buscador integrado
- Filtros por categoría (pills horizontales, mobile-first)
- Grid responsive 2/3/4 columnas
- Modal de detalle con selector de cantidad
- Carrito persistente en localStorage

### Flujo de Pedido (`/carrito`)
- Formulario de cliente con 3 métodos de pago (Efectivo · Transferencia · Alias)
- Muestra el alias/número de billetera cuando el cliente elige pago digital
- Crea la venta en la base de datos y genera link de WhatsApp con comprobante completo
- Pantalla de confirmación con número de pedido

---

## Inicio rápido (Docker)

### Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo

### 1. Clonar y configurar

```bash
git clone <URL_DEL_REPO>
cd MultiLimp
```

### 2. Setup automático

```bash
# Linux / Mac
chmod +x setup.sh && ./setup.sh

# Windows (PowerShell)
docker compose up -d --build
docker compose exec backend python seed.py
```

### 3. Acceder

| Servicio | URL |
|----------|-----|
| Catálogo público | http://localhost:3000 |
| Panel admin | http://localhost:3000/login |
| API REST | http://localhost:8000 |
| Swagger / Docs | http://localhost:8000/docs |

**Credenciales admin por defecto:**
```
Email:      admin@limpieza.com
Contraseña: admin1234
```

> Cambialas en producción ejecutando `make shell-back` y usando el endpoint `PUT /auth/usuarios/{id}`.

---

## Comandos útiles (Makefile)

```bash
make dev          # Levanta todos los servicios
make stop         # Detiene los servicios
make build        # Reconstruye las imágenes Docker
make seed         # Crea usuario admin y categorías base
make migrate msg="descripcion"  # Genera y aplica migración Alembic
make logs         # Tail de logs en tiempo real
make shell-back   # Bash en el contenedor backend
make shell-db     # Consola psql
make reset        # Elimina volúmenes y reinicia (¡borra datos!)
```

---

## Configuración de variables de entorno

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://admin:admin123@localhost:5432/limpieza_db

# JWT — generá una clave segura con: openssl rand -hex 32
SECRET_KEY=tu_clave_secreta_larga
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Cloudinary — https://cloudinary.com (cuenta gratuita)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# WhatsApp del negocio (sin + ni espacios, formato internacional)
WHATSAPP_NEGOCIO=595991000000

# Alias o número de billetera para pagos digitales
ALIAS_PAGO=0991-000000

NOMBRE_NEGOCIO=Distribuidora Limpieza S.A.
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_NOMBRE_NEGOCIO=Distribuidora Limpieza S.A.
NEXT_PUBLIC_WHATSAPP_NEGOCIO=595991000000
```

---

## Instalación sin Docker (desarrollo local)

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate       # Linux/Mac
.venv\Scripts\activate          # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar entorno
cp .env.example .env
# Editar .env con tus valores

# Aplicar migraciones
alembic upgrade head

# Cargar datos iniciales
python seed.py

# Iniciar servidor
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

npm install

cp .env.local.example .env.local
# Editar .env.local con tus valores

npm run dev
```

> Requiere PostgreSQL 16 corriendo localmente en el puerto 5432.

---

## Migraciones de base de datos

```bash
# Generar nueva migración (detecta cambios en los modelos)
alembic revision --autogenerate -m "descripcion del cambio"

# Aplicar todas las migraciones pendientes
alembic upgrade head

# Ver estado actual
alembic current

# Revertir última migración
alembic downgrade -1
```

---

## Importación masiva de productos (CSV)

El sistema acepta archivos CSV con las siguientes columnas:

```
nombre, descripcion, categoria, precio_venta, precio_costo,
stock_actual, stock_minimo, sku, unidad_medida
```

- Las categorías se crean automáticamente si no existen
- Si ya existe un producto con el mismo SKU o nombre, se actualiza
- Los precios van en Guaraníes sin decimales (ej: `15000`)
- Retorna resumen: `{creados, actualizados, errores}`

Plantilla de ejemplo: `backend/plantilla_importacion.csv`

---

## Deploy en Railway

### Opción A — Deploy desde GitHub (recomendado)

1. Crear cuenta en [Railway](https://railway.app)
2. Conectar el repositorio de GitHub
3. Railway detecta los `railway.toml` y crea los servicios automáticamente

#### Variables de entorno en Railway (Backend):

```
DATABASE_URL        → usar la variable ${{Postgres.DATABASE_URL}} de Railway
SECRET_KEY          → cadena aleatoria segura (openssl rand -hex 32)
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
WHATSAPP_NEGOCIO
ALIAS_PAGO
NOMBRE_NEGOCIO
```

#### Variables de entorno en Railway (Frontend):

```
NEXT_PUBLIC_API_URL         → URL pública del servicio backend en Railway
NEXT_PUBLIC_NOMBRE_NEGOCIO
NEXT_PUBLIC_WHATSAPP_NEGOCIO
```

### Opción B — Deploy manual con CLI

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Base de datos en Railway

Railway ofrece PostgreSQL gestionado. Al crearlo, la variable `DATABASE_URL` se inyecta automáticamente en el backend.

El comando de inicio del backend (`railway.toml`) ejecuta las migraciones automáticamente:
```
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Estructura del proyecto

```
MultiLimp/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + routers
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── database.py          # Engine + get_session
│   │   ├── models/              # SQLModel ORM models
│   │   ├── routers/             # Endpoints por módulo
│   │   ├── schemas/             # Pydantic request/response
│   │   └── utils/               # Auth JWT, Cloudinary, WhatsApp
│   ├── alembic/                 # Migraciones de DB
│   ├── seed.py                  # Datos iniciales
│   ├── plantilla_importacion.csv
│   ├── requirements.txt
│   ├── Dockerfile
│   └── railway.toml
│
├── frontend/
│   ├── app/
│   │   ├── (admin)/             # Panel administrativo (requiere auth)
│   │   │   ├── dashboard/       # Métricas + gráfico + ventas recientes
│   │   │   ├── productos/       # CRUD + stop-venta + CSV import
│   │   │   ├── ventas/          # Lista + drawer de detalle
│   │   │   └── stock/           # Alertas + movimientos + entradas
│   │   ├── (catalogo)/          # Catálogo público (sin auth)
│   │   │   ├── page.tsx         # Grid de productos + hero + filtros
│   │   │   └── carrito/         # Carrito + pedido + WhatsApp
│   │   └── login/               # Autenticación admin
│   ├── components/
│   │   ├── admin/               # Sidebar, Header
│   │   └── catalogo/            # CartProvider, CatalogoHeader
│   ├── lib/
│   │   ├── api.ts               # Cliente HTTP + tipos TypeScript
│   │   └── utils.ts             # formatGs, formatDate, cn, badges
│   └── railway.toml
│
├── docker-compose.yml           # Desarrollo
├── docker-compose.prod.yml      # Override producción
├── Makefile                     # Comandos rápidos
├── setup.sh                     # Primer inicio automatizado
└── .gitignore
```

---

## API — Referencia rápida

| Grupo | Prefijo | Auth |
|-------|---------|------|
| Autenticación | `/auth` | — |
| Categorías | `/categorias` | Admin |
| Productos | `/productos` | Admin |
| Catálogo público | `/catalogo` | ❌ Sin auth |
| Ventas | `/ventas` | Mixto |
| Stock | `/stock` | Admin |
| Dashboard | `/dashboard` | Admin |
| Configuración | `/config` | ❌ Sin auth |

Documentación interactiva completa disponible en: **`http://localhost:8000/docs`**

---

## Personalización

| Dato | Dónde cambiarlo |
|------|-----------------|
| Nombre del negocio | `NOMBRE_NEGOCIO` en `.env` y `NEXT_PUBLIC_NOMBRE_NEGOCIO` en `.env.local` |
| Número de WhatsApp | `WHATSAPP_NEGOCIO` |
| Alias de pago | `ALIAS_PAGO` |
| Colores de marca | `tailwind.config.js` → `colors.brand` |
| Logo | Reemplazar el ícono `Droplets` en `Sidebar.tsx` y `CatalogoHeader.tsx` |
| Categorías base | `backend/seed.py` |

---

## Licencia

Proyecto privado — Todos los derechos reservados.
