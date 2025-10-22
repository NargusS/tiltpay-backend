.PHONY: help up down restart logs db-shell clean

help:
	@echo "Available commands:"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make restart   - Restart all services"
	@echo "  make logs      - View logs"
	@echo "  make db-shell  - Connect to PostgreSQL shell"
	@echo "  make clean     - Stop services and remove volumes"

new-domain:
	@if [ -z "$1" ]; then echo "Usage: make new-domain <domain-name>"; exit 1; fi
	mkdir -p app/domains/$1
	mkdir -p app/domains/$1/models
	mkdir -p app/domains/$1/services
	mkdir -p app/domains/$1/controllers
	mkdir -p app/domains/$1/validators
	mkdir -p app/domains/$1/adapters
	mkdir -p app/domains/$1/exceptions

new-migration:


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


deploy-image:
	docker build -t ghcr.io/narguss/tiltpay:latest .
	docker push ghcr.io/narguss/tiltpay:latest
