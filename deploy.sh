# Build and deploy CrowdSolve (Bash)
# Usage: ./deploy.sh [local|staging|production]

#!/bin/bash
set -e

ENVIRONMENT=${1:-local}

echo "============================================"
echo "  CrowdSolve Deployment"
echo "  Environment: $ENVIRONMENT"
echo "============================================"
echo ""

# Load .env
set -a
source .env 2>/dev/null || true
set +a

# Step 1: Stop existing containers
echo "[1/5] Stopping existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true
echo ""

# Step 2: Build all services
echo "[2/5] Building all services..."
docker-compose build --no-cache
echo ""

# Step 3: Start database first
echo "[3/5] Starting database..."
docker-compose up -d postgres
sleep 5
echo ""

# Step 4: Start all services
echo "[4/5] Starting all services..."
docker-compose up -d
sleep 10
echo ""

# Step 5: Health check
echo "[5/5] Checking health..."
BACKEND_PORT=${BACKEND_PORT:-8080}
AI_PORT=${AI_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

RETRIES=0
while [ $RETRIES -lt 10 ]; do
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BACKEND_PORT/actuator/health" 2>/dev/null | grep -q 200; then
        echo "Backend: HEALTHY"
        break
    fi
    RETRIES=$((RETRIES + 1))
    sleep 3
done
if [ $RETRIES -ge 10 ]; then
    echo "Backend: UNHEALTHY after 10 retries"
    exit 1
fi

if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$AI_PORT/health" 2>/dev/null | grep -q 200; then
    echo "AI Service: HEALTHY"
else
    echo "AI Service: UNHEALTHY"
fi

if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" 2>/dev/null | grep -q 200; then
    echo "Frontend: HEALTHY"
else
    echo "Frontend: UNHEALTHY"
fi

echo ""
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"
echo "  Frontend:  http://localhost:$FRONTEND_PORT"
echo "  Backend:   http://localhost:$BACKEND_PORT"
echo "  AI Service: http://localhost:$AI_PORT"
echo ""