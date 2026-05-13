#!/bin/bash
# Script de configuración inicial del proyecto MultiLimp
set -e

echo ""
echo "═══════════════════════════════════════════════"
echo "  MultiLimp — Configuración inicial"
echo "═══════════════════════════════════════════════"
echo ""

# 1. Verificar dependencias
command -v docker >/dev/null 2>&1 || { echo "❌ Docker no encontrado. Instalá Docker Desktop."; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "❌ Docker Compose no encontrado."; exit 1; }

echo "✅ Docker encontrado"

# 2. Crear .env si no existe
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "✅ backend/.env creado desde .env.example"
  echo "   ⚠️  Editá backend/.env con tus credenciales antes de continuar."
fi

if [ ! -f frontend/.env.local ]; then
  cp frontend/.env.local.example frontend/.env.local
  echo "✅ frontend/.env.local creado desde .env.local.example"
fi

# 3. Levantar servicios
echo ""
echo "🚀 Levantando servicios..."
docker compose up -d --build

echo ""
echo "⏳ Esperando que la base de datos esté lista..."
sleep 8

# 4. Ejecutar seed
echo "🌱 Ejecutando seed (usuario admin + categorías)..."
docker compose exec backend python seed.py

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ ¡Todo listo!"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo "  Usuario admin: admin@limpieza.com"
echo "  Contraseña:    admin1234"
echo "═══════════════════════════════════════════════"
echo ""
