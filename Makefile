.PHONY: help up down restart logs db-shell clean

help:
	@echo "Available commands:"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make restart   - Restart all services"
	@echo "  make logs      - View logs"
	@echo "  make db-shell  - Connect to PostgreSQL shell"
	@echo "  make clean     - Stop services and remove volumes"

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

db-shell:
	docker-compose exec postgres psql -U postgres -d tiltpay

clean:
	docker-compose down -v
