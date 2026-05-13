\# PROMPT MAESTRO — CLAUDE CODE

\## Sistema de Gestión para Empresa de Productos de Limpieza



\---



\## ROL Y CONTEXTO



Eres el arquitecto y desarrollador principal de un sistema web full-stack para una empresa de fabricación y venta de productos de limpieza en Paraguay. El sistema tiene tres módulos: Panel Administrativo, Catálogo para Clientes y API Backend. Debes construirlo de forma modular, limpia y lista para producción.



El stack es:

\- \*\*Backend:\*\* Python 3.11 + FastAPI + SQLModel + PostgreSQL + Alembic

\- \*\*Frontend:\*\* Next.js 14 (App Router) + Tailwind CSS + shadcn/ui

\- \*\*Imágenes:\*\* Cloudinary (free tier)

\- \*\*Auth:\*\* JWT con python-jose + bcrypt

\- \*\*Deploy target:\*\* Railway (o Render)



\---



\## SISTEMA DE DISEÑO — IDENTIDAD VISUAL



\### Dirección estética: Azul corporativo profesional

El catálogo público y el panel admin deben seguir este sistema de diseño de forma consistente. Es una distribuidora seria con foco en confianza y profesionalismo.



\### Tipografía

```

Headings / Logo:  'Syne', sans-serif — weights 500, 600

Body / UI:        'Plus Jakarta Sans', sans-serif — weights 400, 500, 600

Google Fonts import en globals.css:

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600\&family=Syne:wght@500;600\&display=swap');

```



\### Paleta de colores (definir en tailwind.config.js)

```js

colors: {

&#x20; brand: {

&#x20;   50:  '#EFF6FF',

&#x20;   100: '#DBEAFE',

&#x20;   200: '#BFDBFE',

&#x20;   400: '#3B82F6',   // acento principal — botones, links, pills activos

&#x20;   700: '#1D4ED8',

&#x20;   800: '#1E3A8A',   // azul profundo — hero, headers, textos fuertes

&#x20;   900: '#1E2D6B',

&#x20; },

&#x20; surface: {

&#x20;   bg:     '#F0F4FF',  // fondo general de páginas

&#x20;   card:   '#FFFFFF',  // fondo de cards

&#x20;   border: '#E2E8F8',  // bordes suaves

&#x20; },

&#x20; text: {

&#x20;   primary:   '#1E293B',

&#x20;   secondary: '#64748B',

&#x20;   muted:     '#94A3B8',

&#x20; },

&#x20; status: {

&#x20;   success:  '#16A34A',

&#x20;   warning:  '#D97706',

&#x20;   danger:   '#DC2626',

&#x20;   info:     '#2563EB',

&#x20; }

}

```



\### Componentes base — reglas de diseño

```

Cards:          bg-white, border border-surface-border, rounded-xl, shadow-sm

Botón primario: bg-brand-400 text-white rounded-lg hover:bg-brand-700

Botón outline:  border border-brand-400 text-brand-800 rounded-lg hover:bg-brand-50

Pills/chips:    border rounded-md text-xs font-medium

Hero (catálogo): bg-gradient-to-br from-brand-800 to-brand-400, text-white

Header admin:   bg-white border-b border-surface-border

Sidebar admin:  bg-brand-800 text-white (links activos con bg-brand-400/20)

Badges stock bajo: bg-red-100 text-red-700

Badges activo:  bg-green-100 text-green-700

Badges stop:    bg-red-500 text-white

```



\### Espaciado y radios

```

Border radius cards:    rounded-xl (12px)

Border radius botones:  rounded-lg (8px)

Border radius pills:    rounded-md (6px)

Gap grids catálogo:     gap-3 (mobile), gap-4 (desktop)

Padding cards:          p-4

```



\### Catálogo — layout mobile-first

```

Header fijo:        h-14, logo izquierda (Syne bold), carrito derecha

Hero:               gradient brand-800→brand-400, buscador integrado, padding py-7

Filtros:            scroll horizontal, pills no wrapping

Grid productos:     grid-cols-2 (mobile) → grid-cols-3 (md) → grid-cols-4 (lg)

Imágenes producto:  aspect-square, bg-brand-50, rounded-t-xl, object-contain

Precio:             font-family Syne, font-semibold, text-brand-800

Botón agregar:      bg-brand-400, rounded-lg, w-7 h-7

```



\### Panel Admin — layout

```

Sidebar:        w-64 fijo, bg-brand-800, logo top, nav items con iconos Lucide

Header:         h-14 bg-white border-b, breadcrumb izquierda, usuario derecha

Content area:   bg-surface-bg, p-6

Cards métricas: bg-white rounded-xl border p-5, número en text-2xl Syne

Tablas:         bg-white rounded-xl border, thead bg-brand-50

Toggle stop:    Switch grande — rojo cuando activo (en venta) → verde cuando parado

```



\---



\## ESTRUCTURA DEL PROYECTO



Genera el proyecto con esta estructura exacta:



```

/

├── backend/

│   ├── app/

│   │   ├── main.py

│   │   ├── config.py

│   │   ├── database.py

│   │   ├── models/

│   │   │   ├── \_\_init\_\_.py

│   │   │   ├── producto.py

│   │   │   ├── categoria.py

│   │   │   ├── venta.py

│   │   │   ├── item\_venta.py

│   │   │   └── movimiento\_stock.py

│   │   ├── routers/

│   │   │   ├── auth.py

│   │   │   ├── productos.py

│   │   │   ├── categorias.py

│   │   │   ├── ventas.py

│   │   │   ├── stock.py

│   │   │   └── dashboard.py

│   │   ├── schemas/

│   │   │   ├── producto.py

│   │   │   ├── venta.py

│   │   │   └── dashboard.py

│   │   └── utils/

│   │       ├── auth.py

│   │       ├── cloudinary.py

│   │       └── whatsapp.py

│   ├── alembic/

│   ├── requirements.txt

│   ├── Dockerfile

│   └── .env.example

│

├── frontend/

│   ├── app/

│   │   ├── (admin)/

│   │   │   ├── layout.tsx

│   │   │   ├── dashboard/page.tsx

│   │   │   ├── productos/page.tsx

│   │   │   ├── productos/nuevo/page.tsx

│   │   │   ├── ventas/page.tsx

│   │   │   └── stock/page.tsx

│   │   ├── (catalogo)/

│   │   │   ├── layout.tsx

│   │   │   ├── page.tsx              ← catálogo público

│   │   │   └── carrito/page.tsx

│   │   ├── login/page.tsx

│   │   └── layout.tsx

│   ├── components/

│   │   ├── admin/

│   │   ├── catalogo/

│   │   └── ui/                       ← shadcn components

│   ├── lib/

│   │   ├── api.ts

│   │   └── utils.ts

│   ├── package.json

│   └── Dockerfile

│

├── docker-compose.yml

└── README.md

```



\---



\## MODELOS DE BASE DE DATOS



Implementa estos modelos con SQLModel. Todos deben tener `created\_at` y `updated\_at` automáticos.



\### Categoria

```python

id: int (PK, autoincrement)

nombre: str (único, max 100)

descripcion: Optional\[str]

activo: bool = True

```



\### Producto

```python

id: int (PK, autoincrement)

nombre: str (max 200)

descripcion: Optional\[str]

sku: Optional\[str] (único)

categoria\_id: int (FK → Categoria)

precio\_venta: Decimal (10,2)

precio\_costo: Optional\[Decimal] (10,2)

stock\_actual: int = 0

stock\_minimo: int = 5

stop\_venta: bool = False          ← bloquea del catálogo

imagen\_url: Optional\[str]

unidad\_medida: str = "unidad"     ← unidad, litro, kg, etc.

activo: bool = True

```



\### Venta

```python

id: int (PK, autoincrement)

numero\_venta: str (único, ej: "V-2024-0001")

cliente\_nombre: str

cliente\_telefono: Optional\[str]

metodo\_pago: Enum("efectivo", "transferencia", "alias", "otro")

estado: Enum("pendiente", "confirmado", "cancelado") = "pendiente"

subtotal: Decimal (10,2)

descuento: Decimal (10,2) = 0

total: Decimal (10,2)

notas: Optional\[str]

origen: Enum("admin", "catalogo") = "catalogo"

```



\### ItemVenta

```python

id: int (PK)

venta\_id: int (FK → Venta)

producto\_id: int (FK → Producto)

cantidad: int

precio\_unitario: Decimal (10,2)

subtotal: Decimal (10,2)

```



\### MovimientoStock

```python

id: int (PK)

producto\_id: int (FK → Producto)

tipo: Enum("entrada", "venta", "ajuste", "devolucion")

cantidad: int                     ← positivo = suma, negativo = resta

stock\_anterior: int

stock\_nuevo: int

referencia\_id: Optional\[int]      ← venta\_id si aplica

descripcion: Optional\[str]

```



\---



\## ENDPOINTS API



\### Auth

\- `POST /auth/login` → JWT token

\- `GET /auth/me` → usuario actual



\### Productos

\- `GET /productos` → lista paginada (filtros: categoria, stop\_venta, activo, search)

\- `GET /productos/{id}` → detalle

\- `POST /productos` → crear (admin)

\- `PUT /productos/{id}` → editar (admin)

\- `PATCH /productos/{id}/stop-venta` → toggle stop de venta (admin)

\- `DELETE /productos/{id}` → soft delete (admin)

\- `POST /productos/importar-csv` → carga masiva desde CSV



\### Catálogo (público, sin auth)

\- `GET /catalogo/productos` → lista solo activos, sin stop\_venta, con stock > 0

\- `GET /catalogo/categorias` → categorías activas



\### Ventas

\- `GET /ventas` → lista paginada (admin)

\- `GET /ventas/{id}` → detalle con items

\- `POST /ventas` → crear venta (admin y catálogo)

\- `PATCH /ventas/{id}/estado` → cambiar estado (admin)

\- `GET /ventas/{id}/comprobante` → genera datos del comprobante



\### Stock

\- `GET /stock/movimientos` → historial de movimientos

\- `POST /stock/entrada` → registrar entrada de stock (admin)

\- `POST /stock/ajuste` → ajuste manual (admin)

\- `GET /stock/alertas` → productos con stock ≤ stock\_mínimo



\### Dashboard

\- `GET /dashboard/stats` → ventas hoy, semana, mes | total productos | alertas stock

\- `GET /dashboard/ventas-por-dia` → datos para gráfico (últimos 30 días)

\- `GET /dashboard/top-productos` → top 10 más vendidos



\---



\## FUNCIONALIDADES CLAVE



\### 1. Stop de Venta

\- Toggle rápido en el panel admin (botón grande, visual claro: verde/rojo)

\- Los productos con `stop\_venta = True` NO aparecen en el catálogo público

\- En el panel admin se ven todos, con badge de estado visible



\### 2. Carga Masiva de Productos (CSV)

El endpoint `POST /productos/importar-csv` debe:

\- Aceptar archivo CSV con columnas: `nombre, descripcion, categoria, precio\_venta, precio\_costo, stock\_actual, stock\_minimo, sku, unidad\_medida`

\- Crear categorías automáticamente si no existen

\- Retornar resumen: `{creados: N, actualizados: N, errores: \[{fila, motivo}]}`

\- La UI debe mostrar un modal de resultado con el resumen



\### 3. Generación de Comprobante + WhatsApp



En `utils/whatsapp.py` implementa la función `generar\_link\_whatsapp(venta)` que:

1\. Construye el mensaje de texto con el detalle de la venta

2\. Genera el link `wa.me/{WHATSAPP\_NEGOCIO}?text=...` con URL encoding

3\. El mensaje debe incluir:



```

🧴 \*PEDIDO #{numero\_venta}\*

📅 {fecha}



\*Cliente:\* {nombre}

\*Teléfono:\* {telefono}



\*PRODUCTOS:\*

{cantidad}x {producto} — Gs. {precio}

...



\*Subtotal:\* Gs. {subtotal}

\*Total:\* Gs. {total}



\*Método de pago:\* {metodo\_pago}

{si alias → mostrar el alias configurado}



¡Gracias por su pedido!

```



El frontend al completar el pedido abre este link en `window.open()`.



\### 4. Alias como Método de Pago

\- Variable de entorno `ALIAS\_PAGO` con el alias del negocio (ej: número de billetera)

\- Cuando el cliente selecciona "Alias/Transferencia" en el carrito, se muestra el alias prominentemente con instrucción de enviar captura de pantalla

\- Este dato se incluye en el comprobante de WhatsApp



\---



\## PANEL ADMINISTRATIVO — UI



Construye el admin con Next.js 14 App Router y shadcn/ui. Diseño: sidebar lateral fijo, header con nombre del usuario.



\### Dashboard (`/admin/dashboard`)

\- Cards superiores: Ventas Hoy | Ventas Semana | Ventas Mes | Productos en stock

\- Alerta visual si hay productos con stock bajo (badge rojo en sidebar)

\- Gráfico de barras: ventas de los últimos 30 días (usar Recharts)

\- Tabla: últimas 10 ventas con estado y botón de acción rápida



\### Productos (`/admin/productos`)

\- Tabla con: imagen (thumbnail), nombre, SKU, categoría, precio, stock, estado stop\_venta

\- Barra de búsqueda y filtros (categoría, estado)

\- Botón "Stop de Venta" por fila: GRANDE, verde/rojo, toggle inmediato sin confirmar

\- Botón "Nueva entrada de stock" por fila

\- Acciones: editar, desactivar

\- Botón "Importar CSV" con modal de carga y resumen de resultado

\- Botón "Nuevo producto" → formulario



\### Ventas (`/admin/ventas`)

\- Tabla: número, fecha, cliente, total, método de pago, estado, origen (admin/catálogo)

\- Filtros por fecha, estado, método de pago

\- Click en fila → drawer lateral con detalle completo + botones cambiar estado

\- Botón "Nueva Venta Manual" → modal con buscador de productos y carrito



\### Stock (`/admin/stock`)

\- Historial de movimientos con paginación

\- Botón "Registrar Entrada" → modal con producto, cantidad, descripción

\- Sección "Alertas" → productos con stock bajo en rojo



\---



\## CATÁLOGO PÚBLICO — UI



Este es el módulo más importante visualmente. Debe ser \*\*moderno, limpio, mobile-first\*\*.



\### Diseño

\- Header fijo con logo del negocio, nombre, y badge del carrito con cantidad

\- Hero simple con nombre del negocio y tagline

\- Filtros horizontales por categoría (pills/chips clickeables)

\- Grid de productos: 2 columnas en móvil, 3-4 en desktop

\- Card de producto: imagen, nombre, precio en Guaraníes (formato: `Gs. 1.500.000`), badge "Sin stock" si stock = 0, badge "Agotado temporalmente" si stop\_venta



\### Card de Producto

\- Click → modal o drawer con detalle completo + cantidad + botón "Agregar al carrito"

\- Si stop\_venta o sin stock → botón deshabilitado con mensaje



\### Carrito (`/carrito`)

\- Lista de items con cantidad editable (+ / - botones)

\- Subtotal y total en tiempo real

\- Formulario de datos del cliente: nombre (required), teléfono (required)

\- Selector de método de pago:

&#x20; - Efectivo contra entrega

&#x20; - Transferencia bancaria

&#x20; - Alias (muestra el alias configurado con instrucción de captura)

\- Botón "Enviar Pedido por WhatsApp" → crea la venta en la DB y abre el link de WhatsApp

\- Confirmación visual antes de enviar



\---



\## CONFIGURACIÓN Y VARIABLES DE ENTORNO



\### Backend `.env.example`

```env

DATABASE\_URL=postgresql://user:password@localhost:5432/limpieza\_db

SECRET\_KEY=tu\_secret\_key\_muy\_largo\_y\_seguro

ALGORITHM=HS256

ACCESS\_TOKEN\_EXPIRE\_MINUTES=1440



CLOUDINARY\_CLOUD\_NAME=

CLOUDINARY\_API\_KEY=

CLOUDINARY\_API\_SECRET=



WHATSAPP\_NEGOCIO=595991000000   ← número en formato internacional sin +

ALIAS\_PAGO=0991-000000           ← alias o número de billetera del negocio

NOMBRE\_NEGOCIO=Distribuidora Limpieza S.A.

```



\### Frontend `.env.local.example`

```env

NEXT\_PUBLIC\_API\_URL=http://localhost:8000

NEXT\_PUBLIC\_NOMBRE\_NEGOCIO=Distribuidora Limpieza S.A.

NEXT\_PUBLIC\_WHATSAPP\_NEGOCIO=595991000000

```



\---



\## DOCKER COMPOSE (DESARROLLO)



```yaml

version: '3.9'

services:

&#x20; db:

&#x20;   image: postgres:16-alpine

&#x20;   environment:

&#x20;     POSTGRES\_DB: limpieza\_db

&#x20;     POSTGRES\_USER: admin

&#x20;     POSTGRES\_PASSWORD: admin123

&#x20;   ports:

&#x20;     - "5432:5432"

&#x20;   volumes:

&#x20;     - postgres\_data:/var/lib/postgresql/data



&#x20; backend:

&#x20;   build: ./backend

&#x20;   ports:

&#x20;     - "8000:8000"

&#x20;   env\_file: ./backend/.env

&#x20;   depends\_on:

&#x20;     - db

&#x20;   volumes:

&#x20;     - ./backend:/app

&#x20;   command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload



&#x20; frontend:

&#x20;   build: ./frontend

&#x20;   ports:

&#x20;     - "3000:3000"

&#x20;   env\_file: ./frontend/.env.local

&#x20;   depends\_on:

&#x20;     - backend

&#x20;   volumes:

&#x20;     - ./frontend:/app

&#x20;     - /app/node\_modules



volumes:

&#x20; postgres\_data:

```



\---



\## ORDEN DE IMPLEMENTACIÓN



Sigue este orden estrictamente:



1\. \*\*Backend base\*\* — `main.py`, `config.py`, `database.py`, modelos SQLModel, migraciones Alembic

2\. \*\*Auth\*\* — endpoint login, JWT, middleware de autenticación

3\. \*\*CRUD Productos y Categorías\*\* — todos los endpoints incluyendo import CSV

4\. \*\*CRUD Ventas y Stock\*\* — endpoints de ventas, movimientos, dashboard stats

5\. \*\*Utilidades\*\* — cloudinary upload, generador de link WhatsApp

6\. \*\*Frontend Admin\*\* — layout, dashboard, productos (con toggle stop venta), ventas, stock

7\. \*\*Frontend Catálogo\*\* — catálogo público, carrito, flujo de pedido + WhatsApp

8\. \*\*Docker Compose\*\* y archivos de configuración

9\. \*\*README\*\* con instrucciones de instalación y deploy en Railway



\---



\## CONVENCIONES DE CÓDIGO



\- \*\*Python:\*\* snake\_case, type hints en todas las funciones, docstrings en routers

\- \*\*TypeScript:\*\* tipos explícitos, no `any`, componentes funcionales con arrow functions

\- \*\*Commits:\*\* mensajes en español descriptivos por módulo

\- \*\*Errores:\*\* siempre retornar `{detail: "mensaje claro"}` en FastAPI

\- \*\*Paginación:\*\* todos los GET de listas deben soportar `?page=1\&limit=20`

\- \*\*Fechas:\*\* siempre UTC en DB, formatear en frontend según Paraguay (UTC-4)

\- \*\*Moneda:\*\* guaraníes, sin decimales, formato `Gs. 1.500.000`



\---



\## NOTAS ADICIONALES



\- Los datos del negocio (logo, colores, WhatsApp, alias) deben venir de variables de entorno o de una tabla de configuración en DB, NO hardcodeados

\- El catálogo debe funcionar sin login (público)

\- El panel admin requiere JWT en todas las rutas

\- Preparar el sistema para que en el futuro pueda agregarse: lista de precios diferenciada (minorista/mayorista), delivery con costo, y notificaciones por email

\- La tabla de usuarios admin es simple por ahora: solo nombre, email, contraseña hasheada, rol (admin/operador)



\---



\*\*Empieza por el Paso 1: Backend base. Genera todos los archivos del backend incluyendo modelos completos, configuración, y docker-compose. Cuando termines cada paso, indicá "✅ Paso N completado" y esperá confirmación antes de continuar.\*\*

