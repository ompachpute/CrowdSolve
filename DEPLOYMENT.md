# CrowdSolve Deployment Guide

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Node.js 18+ (for local frontend development)
- Java 17+ (for local backend development)
- Python 3.11+ (for local AI service development)

## Quick Start (Docker)

### 1. Copy environment file
```bash
cp .env.example .env
# Edit .env with your settings
```

### 2. Deploy
```bash
# Windows
deploy.bat

# PowerShell
./deploy.ps1

# Linux/Mac
./deploy.sh
```

### 3. Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- AI Service: http://localhost:8000

## Local Development

### Start services individually

```bash
# 1. PostgreSQL
docker compose up -d

# 2. Backend
cd backend
mvn spring-boot:run

# 3. AI Service
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 4. Frontend
cd frontend
npm install
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | localhost | Database host |
| `DB_PORT` | 5432 | Database port |
| `DB_NAME` | crowdsolve | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `JWT_SECRET` | (required) | JWT signing secret |
| `JWT_EXPIRATION_MS` | 86400000 | Token expiry (24h) |
| `AI_SERVICE_URL` | http://localhost:8000 | AI service URL |
| `BACKEND_PORT` | 8080 | Backend port |
| `AI_PORT` | 8000 | AI service port |
| `FRONTEND_PORT` | 3000 | Frontend port |

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@gmail.com | password |
| Team | team@gmail.com | password |
| Industry | org@gmail.com | password |
| Government | gover@gmail.com | password |

## Production Deployment

### 1. Set strong JWT secret
```bash
openssl rand -hex 32 > .env
```

### 2. Set environment variables
```bash
export JWT_SECRET=$(openssl rand -hex 32)
export DB_PASSWORD=your_strong_password
export DB_NAME=crowdsolve_prod
```

### 3. Deploy
```bash
./deploy.sh production
```

### 4. Verify
```bash
curl http://localhost:8080/actuator/health
curl http://localhost:8000/health
```

## Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| postgres | postgres:15-alpine | 5432 | Database |
| backend | eclipse-temurin:17-jre-alpine | 8080 | Java API |
| ai-service | python:3.11-slim | 8000 | AI Service |
| frontend | nginx:alpine | 3000 | React App |

## Build Artifacts

- Backend: `backend/target/portal-1.0.0.jar`
- Frontend: `frontend/build/` (static files)
- AI Service: `ai-service/app/` (Python source)