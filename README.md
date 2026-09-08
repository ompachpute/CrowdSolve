# CrowdSolve Portal — Societal Problem Crowdsourcing & Solving Platform

Full-stack web platform connecting Citizens, Teams, Industries/NGOs, and Government to crowdsource, structure, match, fund, and resolve societal problems.

## Tech Stack

- **Frontend:** React 18 + React Router 6 + Axios + React-Bootstrap
- **Backend:** Java 17 + Spring Boot 3.2 + Spring Security (JWT)
- **Database:** PostgreSQL 15
- **AI Microservice:** Python 3.10 + FastAPI + scikit-learn
- **Containerization:** Docker Compose (PostgreSQL)

## Project Structure

```
CrowdSolve Portal/
├── backend/                  # Spring Boot REST API (port 8080)
│   ├── pom.xml
│   ├── src/main/java/...
│   │   ├── entity/           # JPA entities (8)
│   │   ├── repository/       # Spring Data JPA repos (8)
│   │   ├── service/          # Business logic (8 services)
│   │   ├── controller/       # REST endpoints (8 controllers)
│   │   ├── dto/              # Request/Response DTOs (13)
│   │   ├── security/         # JWT auth + CORS
│   │   └── CrowdSolvePortalApplication.java
│   └── src/main/resources/
│       ├── application.properties
│       ├── schema.sql        # PostgreSQL DDL
│       └── data.sql          # Seed data (5 problems, 14 users, 8 teams)
├── frontend/                 # React SPA (port 3000)
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── api/axios.js
│       ├── contexts/AuthContext.js
│       ├── components/       # Navbar, ProtectedRoute
│       └── pages/            # 4 role dashboards + Login/Register
└── ai-service/               # FastAPI AI microservice (port 8000)
    ├── requirements.txt
    └── app/
        ├── main.py
        ├── models.py
        ├── routes.py
        └── services.py
```

## Prerequisites

- **JDK 17** — [Download](https://adoptium.net/temurin/releases/?version=17)
- **Maven 3.8+** — [Download](https://maven.apache.org/download.cgi)
- **Node.js 18+** + npm — [Download](https://nodejs.org/)
- **Python 3.10+** + pip — [Download](https://www.python.org/downloads/)
- **Docker Desktop** — [Download](https://www.docker.com/products/docker-desktop/)

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

Verify it's running:
```bash
docker compose ps
```

### 2. Start Backend

```bash
cd backend
mvn spring-boot:run
```

Backend starts at `http://localhost:8080`. Schema + seed data auto-run on startup.

### 3. Start AI Service

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

AI service at `http://localhost:8000`.

### 4. Start Frontend

```bash
cd frontend
npm install
npm start
```

Frontend at `http://localhost:3000`.

## Default Demo Accounts

| Email | Password | Role | Dashboard |
|-------|----------|------|-----------|
| citizen@gmail.com | password | CITIZEN | /citizen |
| team@gmail.com | password | TEAM | /team |
| org@gmail.com | password | INDUSTRY_NGO | /industry |
| gover@gmail.com | password | GOVERNMENT | /government |

> **Note:** All demo passwords are bcrypt-hashed to `password` in data.sql.

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Citizen
- `POST /api/problems` — submit problem
- `GET /api/problems/mine` — my problems

### Problems (all roles)
- `GET /api/problems` — browse all
- `GET /api/problems/with-prototypes` — gov view
- `GET /api/problems/solved` — solved by team/funder
- `GET /api/problems/in-progress` — in-progress by team/funder
- `POST /api/problems/{id}/mark-solved` — gov action

### Match Requests
- `POST /api/requests` — send request
- `GET /api/requests/team` — team inbox
- `GET /api/requests/industry` — industry inbox
- `POST /api/requests/{id}/accept`
- `POST /api/requests/{id}/reject`

### Prototypes
- `POST /api/prototypes` — upload prototype
- `POST /api/prototypes/{id}/fund` — pledge funding
- `POST /api/prototypes/{id}/approve` — gov approval

### Industry
- `POST /api/problems/{id}/sponsor` — pledge sponsorship
- `GET /api/industries` — browse industries
- `GET /api/teams` — browse teams

### Admin/Moderation
- `POST /api/users/{id}/ban`
- `GET /api/problems/flagged`

### Statistics
- `GET /api/statistics` — gov dashboard data

### AI Microservice (internal)
- `POST /ai/structure` — structure raw problem text
- `POST /ai/duplicate-check` — check for duplicates
- `POST /ai/match` — rank candidate teams

## Workflow

1. **Citizen** submits a problem → AI structures it → duplicate check runs
2. If duplicate → auto-reject silently, log to `DuplicateLink` (no notification)
3. If not duplicate → published, AI ranks matching teams
4. **Teams** and **Industries/NGOs** can browse each other and send direct requests
5. On **ACCEPTED** → contact info shared, notes field opens
6. **Team** uploads prototype directly onto the problem
7. **Industry/NGO** or **Government** pledges funding (tracked commitment only)
8. **Government** reviews prototype, approves it, marks problem `SOLVED`

## Non-Requirements (Out of Scope)

- No citizen notification system
- No real payment gateway (funding = tracked commitment/pledge)
- No real-time chat (contact reveal + notes field suffice)
- No blockchain/AR/VR/IoT integrations

## Seed Data

The `data.sql` seeds 5 problems across 5 categories, 14 users (5 citizens, 3 teams, 3 industries/NGOs, 3 government), 8 teams with varied skills, duplicate problem pairs, and fundings. 2 problems are uploaded from the citizen demo account (citizen@gmail.com).

## License

MIT
