.PHONY: help dev stop build seed migrate logs shell-backend shell-db reset

help:
	@echo ""
	@echo "  Comandos disponibles:"
	@echo ""
	@echo "  make dev          Levanta todos los servicios en modo desarrollo"
	@echo "  make stop         Detiene todos los servicios"
	@echo "  make build        Reconstruye imágenes Docker"
	@echo "  make seed         Crea usuario admin y categorías base"
	@echo "  make migrate      Genera y aplica migración Alembic"
	@echo "  make logs         Ver logs de todos los servicios"
	@echo "  make shell-back   Shell en el contenedor backend"
	@echo "  make shell-db     Consola psql en la base de datos"
	@echo "  make reset        Elimina volúmenes y reinicia (¡borra datos!)"
	@echo ""

dev:
	docker compose up -d
	@echo "✅ Servicios corriendo:"
	@echo "   Backend:  http://localhost:8000"
	@echo "   Frontend: http://localhost:3000"
	@echo "   API Docs: http://localhost:8000/docs"

stop:
	docker compose down

build:
	docker compose build --no-cache

seed:
	docker compose exec backend python seed.py

migrate:
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"
	docker compose exec backend alembic upgrade head

logs:
	docker compose logs -f

shell-back:
	docker compose exec backend bash

shell-db:
	docker compose exec db psql -U admin -d limpieza_db

reset:
	@echo "⚠️  Esto eliminará todos los datos. ¿Continuar? [y/N]" && read ans && [ $${ans:-N} = y ]
	docker compose down -v
	docker compose up -d
