# TiltPay

## Prerequisites

- Docker
- Docker Compose
- Make (optional)

## Getting Started

### Start the Database

```bash
make up
# or
docker-compose up -d
```

### Stop the Database

```bash
make down
# or
docker-compose down
```

### View Logs

```bash
make logs
# or
docker-compose logs -f
```

### Connect to PostgreSQL

```bash
make db-shell
# or
docker-compose exec postgres psql -U postgres -d tiltpay
```

### Clean Up (Remove Volumes)

```bash
make clean
# or
docker-compose down -v
```

## Database Configuration

- **Host**: localhost
- **Port**: 5435
- **Database**: tiltpay
- **User**: postgres
- **Password**: postgres

## Available Make Commands

Run `make help` to see all available commands.
