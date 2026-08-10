# ApiPulse — API Observability Platform

> Real-time API monitoring, ML-powered anomaly detection, and operations intelligence — built for the modern engineering stack.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│              React 19 + Vite 8 + Tailwind v4               │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/JSON
┌─────────────────────────▼───────────────────────────────────┐
│                   FastAPI (Python 3.12)                      │
│  Auth · API Registry · Analytics · ML · Prometheus metrics  │
└───────┬─────────────────────────────────────┬───────────────┘
        │ asyncpg                              │ redis-py
┌───────▼──────────┐               ┌──────────▼──────────────┐
│   PostgreSQL 16  │               │       Redis 7            │
│ (SQLAlchemy ORM  │               │  (caching, rate limits)  │
│  + Alembic)      │               └─────────────────────────┘
└──────────────────┘
```

**Deployment** — Docker Compose (local) · Kubernetes (production) · GitHub Actions CI/CD

---

## Features

| Category | Capabilities |
|---|---|
| API Registry | Add / edit / delete APIs, dual table/card view, endpoint copy, status badges |
| Real-time Monitoring | Request rate, error rate, P95/P99 latency per API |
| ML Forecasting | Linear Regression, Random Forest, Gradient Boosting — 24-hour horizon with confidence bounds |
| Anomaly Detection | IsolationForest on multi-feature traffic data (requests, error rate, latency) |
| Model Comparison | Automated benchmark of 3 models — R², MAE, RMSE, fit time |
| Operational Insights | Trend slope, SLA breach detection, volatility scoring |
| User Management | RBAC (Admin/Developer/Viewer), full CRUD, search/filter/sort/paginate |
| Reports | Downloadable CSV/JSON exports per API and date range |
| Auth | JWT access + refresh tokens, bcrypt password hashing |

---

## Quick Start (Local — Docker Compose)

### Prerequisites

- Docker ≥ 24 and Docker Compose v2
- Node.js 20+ and pnpm 9+ (for frontend-only dev)
- Python 3.12+ (for backend-only dev)

### 1. Clone and configure

```bash
git clone https://github.com/your-org/apipulse.git
cd apipulse
cp .env.example .env          # edit DB_PASSWORD, SECRET_KEY, REDIS_PASSWORD
```

### 2. Start everything

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API (FastAPI) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

### 3. Seed demo data

```bash
docker compose exec backend python -m app.database.seed
```

This creates 7 users, 10 API endpoints, 1,680 hourly metric records, and 5 anomaly events.

### Demo credentials

| Email | Password | Role |
|---|---|---|
| alex.chen@acme.com | Admin@2026 | Admin |
| m.johnson@acme.com | Dev@2026! | Developer |
| d.park@acme.com | View@2026! | Viewer |

---

## Backend Setup (standalone)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Apply migrations
alembic upgrade head

# Seed demo data
python -m app.database.seed

# Start server
uvicorn main:app --reload --port 8000
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Async PostgreSQL DSN |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `SECRET_KEY` | — | JWT signing secret (min 32 chars) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | JWT refresh token TTL |
| `RATE_LIMIT` | `100/minute` | Default per-IP rate limit |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

---

## Frontend Setup (standalone)

```bash
pnpm install
pnpm dev          # starts Vite on port 5173 (or $PORT)
pnpm build        # production build → dist/
```

---

## API Reference

Base URL: `/api/v1`

### Authentication

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login` | Obtain JWT tokens (OAuth2 form) |
| `POST` | `/auth/refresh` | Exchange refresh token for new access token |
| `GET` | `/auth/me` | Current authenticated user |

### API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/endpoints` | List all monitored APIs |
| `POST` | `/endpoints` | Register a new API |
| `GET` | `/endpoints/{id}` | Get single API details |
| `PUT` | `/endpoints/{id}` | Update API metadata |
| `DELETE` | `/endpoints/{id}` | Remove API from registry |

### Metrics & Analytics

| Method | Path | Description |
|---|---|---|
| `GET` | `/metrics/{api_id}` | Time-series metrics for one API |
| `GET` | `/analytics/summary` | Aggregated health across all APIs |
| `GET` | `/analytics/traffic` | Hourly request volumes (last 7d) |
| `GET` | `/analytics/errors` | Error rate trends |
| `GET` | `/analytics/anomalies` | All detected anomaly events |

### Machine Learning

| Method | Path | Description |
|---|---|---|
| `POST` | `/ml/train` | Train GradientBoosting model on recent data |
| `GET` | `/ml/predict/traffic` | Multi-model traffic forecast (`?model=&horizon=`) |
| `GET` | `/ml/detect/anomalies` | IsolationForest anomaly scan (`?contamination=`) |
| `GET` | `/ml/models/compare` | Benchmark Linear/RF/GBM — R², MAE, RMSE |
| `GET` | `/ml/insights` | AI-generated operational insights |

### Users (Admin only)

| Method | Path | Description |
|---|---|---|
| `GET` | `/users` | List all users |
| `POST` | `/users` | Create user directly (no invitation) |
| `PUT` | `/users/{id}` | Update user details or role |
| `DELETE` | `/users/{id}` | Remove user |

### Reports

| Method | Path | Description |
|---|---|---|
| `GET` | `/reports/generate` | Generate CSV/JSON report (`?api_id=&format=`) |

---

## Machine Learning Models

### Traffic Forecasting

Three sklearn Pipeline models with lag feature engineering:

```
Features:
  lag_1 … lag_N   — past N hours of request counts
  trend            — monotonic hour index
  hour_sin         — sin(2π × hour / 24)  [daily seasonality]
  hour_cos         — cos(2π × hour / 24)

Models:
  LinearRegression    — baseline, lowest variance
  RandomForestRegressor (100 estimators)
  GradientBoostingRegressor (200 estimators, lr=0.05)

Output:
  ForecastPoint per hour — predicted, lower_90, upper_90
  Uncertainty grows as σ = RMSE × √horizon
```

### Anomaly Detection

```
Algorithm: IsolationForest (200 estimators, random_state=42)
Features:
  - Normalized request count
  - Error rate %
  - Response time (ms)
  - hour_sin / hour_cos  (time-of-day context)
  - Z-score vs rolling 24h window

Output: anomaly_score ∈ [0, 1], is_anomaly bool
```

---

## Database Schema

Managed by Alembic async migrations (`backend/alembic/versions/`).

### Core Tables

| Table | Description |
|---|---|
| `users` | App users with RBAC role + status |
| `api_endpoints` | Registered APIs — metadata, health, uptime |
| `metrics` | Hourly time-series (requests, errors, latencies) |
| `anomalies` | Detected anomaly events with severity + resolution |
| `ml_predictions` | Persisted forecast results for trend analysis |

### Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "describe change"

# Rollback one step
alembic downgrade -1
```

---

## Testing

```bash
cd backend
pytest -v --cov=app --cov-report=term-missing
```

| Test Module | Coverage |
|---|---|
| `tests/test_health.py` | Health and root endpoints |
| `tests/test_ml_service.py` | ML service unit tests (all 7 classes, 20+ cases) |
| `tests/test_ml_router.py` | ML API integration tests (all 5 endpoints) |

Tests use SQLite in-memory database via `conftest.py` — no external services required.

---

## Docker

### Backend

```bash
docker build -f backend/Dockerfile -t apipulse-backend .
docker run -p 8000:8000 --env-file .env apipulse-backend
```

### Frontend

```bash
docker build -f Dockerfile.frontend -t apipulse-frontend .
docker run -p 80:80 apipulse-frontend
```

### Compose

```bash
docker compose up -d            # start all services
docker compose logs -f backend  # stream backend logs
docker compose down -v          # stop + delete volumes
```

---

## Kubernetes Deployment

All manifests live in `k8s/`. Requires a cluster with `nginx-ingress` and `cert-manager` installed.

```bash
# Apply everything
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml       # edit placeholders first
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/redis/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Verify
kubectl get pods -n apipulse
kubectl get svc  -n apipulse
```

### Autoscaling

| Workload | Min | Max | CPU trigger | Memory trigger |
|---|---|---|---|---|
| Backend | 2 | 10 | 70% | 80% |
| Frontend | 2 | 6 | 60% | — |

---

## CI/CD (GitHub Actions)

### CI — `.github/workflows/ci.yml`

Triggered on every push and pull request to `main` / `develop`.

| Job | Steps |
|---|---|
| `backend-ci` | ruff lint → mypy type-check → pytest (with Postgres + Redis services) → Codecov |
| `frontend-ci` | pnpm install → `tsc --noEmit` → `pnpm build` → upload artifact |
| `docker-lint` | Validate docker-compose.yml |

### CD — `.github/workflows/cd.yml`

Triggered on push to `main` and semver tags (`v*`).

| Job | Steps |
|---|---|
| `build-and-push` | QEMU + Buildx → GHCR login → build linux/amd64 + arm64 images |
| `deploy` | kubectl apply configs → rolling image update → smoke test |

### Required Secrets

```
GHCR_TOKEN         — GitHub Container Registry PAT
KUBECONFIG         — base64-encoded kubeconfig for target cluster
DB_PASSWORD        — production database password
REDIS_PASSWORD     — Redis AUTH password
SECRET_KEY         — JWT signing secret
CODECOV_TOKEN      — Codecov upload token
```

---

## Project Structure

```
apipulse/
├── src/                          # React frontend
│   ├── App.tsx                   # Root component + routing
│   ├── index.css                 # Tailwind v4 + design tokens
│   ├── context/
│   │   ├── UserContext.tsx        # RBAC user state
│   │   └── ToastContext.tsx       # Global notifications
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ApiRegistry.tsx        # Full CRUD registry
│   │   ├── TrafficAnalytics.tsx
│   │   ├── AlertsAnomaly.tsx
│   │   ├── UserManagement.tsx     # Add/Edit/Delete users
│   │   ├── Reports.tsx
│   │   └── AuthPage.tsx
│   └── components/
│       ├── Sidebar.tsx
│       └── ...
├── backend/
│   ├── main.py                   # FastAPI app + router registration
│   ├── app/
│   │   ├── config/settings.py    # Pydantic settings
│   │   ├── database/
│   │   │   ├── connection.py     # AsyncEngine + Base
│   │   │   └── seed.py           # Demo data seeder
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── routers/              # FastAPI route handlers
│   │   └── services/
│   │       └── ml_service.py     # scikit-learn ML implementation
│   ├── alembic/                  # Database migrations
│   │   └── versions/
│   │       ├── 001_initial_schema.py
│   │       └── 002_add_ml_predictions_table.py
│   └── tests/
│       ├── conftest.py
│       ├── test_health.py
│       ├── test_ml_service.py
│       └── test_ml_router.py
├── k8s/                          # Kubernetes manifests
├── .github/workflows/            # CI/CD pipelines
├── Dockerfile.frontend           # Multi-stage frontend build
├── nginx.conf                    # SPA routing + caching + security headers
└── docker-compose.yml
```

---

## Hackathon Compliance Matrix

| Criteria | Implementation | Location |
|---|---|---|
| Python Development | FastAPI, SQLAlchemy async ORM, scikit-learn, passlib, pytest | `backend/` |
| SQL Database | PostgreSQL 16, Alembic migrations, normalized schema + indexes | `backend/alembic/` |
| Data Analysis & Visualization | Recharts time-series, summary stats, percentile analysis | `src/pages/TrafficAnalytics.tsx` |
| Machine Learning | LinearRegression, RandomForest, GradientBoosting, IsolationForest | `backend/app/services/ml_service.py` |
| FastAPI REST APIs | 5 routers, 25+ endpoints, JWT auth, rate limiting, Prometheus metrics | `backend/app/routers/` |
| Docker Containerization | Multi-stage Dockerfile (backend + frontend), docker-compose | `Dockerfile.frontend`, `backend/Dockerfile` |
| Kubernetes Deployment | Namespace, ConfigMap, Secrets, StatefulSet, Deployments, HPA, Ingress | `k8s/` |
| GitHub Repository | Full version-controlled project | `.git/` |
| GitHub Actions CI/CD | Backend CI + frontend CI + GHCR CD + kubectl deploy | `.github/workflows/` |

---

## License

MIT — see `LICENSE`.
