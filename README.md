# TiltPay

Payment platform API built with AdonisJS following Domain-Driven Design principles.

## Prerequisites

- Node.js >= 20
- Docker
- Docker Compose
- Make (optional)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Or create manually with:

```env
PORT=3333
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=5435
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=tiltpay

# App Key (generate with: node ace generate:key)
APP_KEY=your-app-key-here
```

### 3. Start the Database

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

### 4. Run Database Migrations

```bash
node ace migration:run
```

### 5. Start the Application

```bash
npm run dev
```

The API will be available at `http://localhost:3333`

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
