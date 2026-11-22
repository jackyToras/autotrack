# 🚗 AutoTrack — Automotive Maintenance & Fleet Telemetry API

AutoTrack is a production-ready, containerized backend service written in **Go (Golang)** designed for vehicle health tracking, predictive maintenance calculation, and service log lifecycle management.

Built using **Gin**, **GORM**, **PostgreSQL**, and **Redis**, the system demonstrates idiomatic Go patterns, database transactions, cache invalidation strategies, and asynchronous background computing with Goroutines.

---

## ⚡ Tech Stack & Architecture

- **Language**: Go (Golang 1.24+)
- **HTTP Framework**: [Gin Web Framework](https://github.com/gin-gonic/gin)
- **Database & ORM**: PostgreSQL with [GORM](https://gorm.io)
- **Caching**: [Redis](https://redis.io) (go-redis v9)
- **Authentication**: JWT (JSON Web Tokens via `golang-jwt/jwt/v5`) & `bcrypt` password hashing
- **Containerization**: Docker & Docker Compose (Multi-stage build)

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client / React                         │
└────────────────────────────────┬────────────────────────────────┘
                                 │ REST APIs (JSON / Bearer JWT)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Gin HTTP Engine                            │
│  ├── CORS & Logging Middleware                                  │
│  └── JWT Authentication Middleware                              │
└──────┬─────────────────────────┬─────────────────────────┬──────┘
       │                         │                         │
       ▼                         ▼                         ▼
┌──────────────┐         ┌──────────────┐          ┌──────────────┐
│ Auth Handler │         │VehicleHandler│          │ServiceHandler│
└──────┬───────┘         └──────┬───────┘          └──────┬───────┘
       │                         │                         │
       ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Analytics & Service Layer                    │
│   ├── Predictive Maintenance (Mileage delta & date regression)  │
│   ├── Goroutine Async Cache Warming (`go AsyncRecompute()`)     │
│   └── Cache Invalidation Logic                                  │
└──────────────┬───────────────────────────────────┬──────────────┘
               │                                   │
               ▼                                   ▼
      ┌─────────────────┐                 ┌─────────────────┐
      │   PostgreSQL    │                 │   Redis Cache   │
      │  (GORM Models & │                 │  (15m TTL & Key │
      │   ACID Trans.)  │                 │  Invalidation)  │
      └─────────────────┘                 └─────────────────┘
```

---

## 🚀 Key Engineering Features

### 1. Relational Database Design with ACID Guarantees
- Multi-table schema (`Users`, `Vehicles`, `ServiceLogs`, `ServiceAlerts`) with strict foreign keys and cascading deletes.
- **Transactional Consistency**: When recording a service log, the insertion of the log and updating the vehicle's current odometer happens inside an atomic **database transaction** (`db.Transaction(...)`). If any step fails, the entire transaction rolls back.

### 2. Redis Caching & Cache-Aside Invalidation
- The vehicle dashboard summary (`TotalSpent`, `AverageCost`, `LastService`, `NextDueEstimate`) is cached in Redis with a 15-minute TTL.
- **Consistency**: Whenever a user modifies a vehicle or logs a new service, the cache key (`vehicle:analytics:<id>`) is invalidated, and a background **Goroutine** asynchronously pre-computes and warms the cache (`AsyncRecompute`).

### 3. Concurrency & Graceful Shutdown
- Asynchronous metrics calculation utilizes non-blocking Go routines with `context.WithTimeout` to avoid hanging resources.
- The HTTP server intercepts `os.Interrupt`, `syscall.SIGINT`, and `syscall.SIGTERM` signals for **graceful shutdown**, completing active HTTP requests before releasing database connection pools.

### 4. Resilient Fallbacks
- If Redis is temporarily unavailable or down, the system logs a warning and automatically falls back to direct PostgreSQL queries without crashing or throwing 500 errors to users.

---

## 📡 API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status & uptime |
| `POST` | `/api/v1/auth/register` | Register new user account |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT |

### Protected Endpoints (`Authorization: Bearer <token>`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/auth/profile` | Retrieve authenticated user profile |
| `POST` | `/api/v1/vehicles` | Register a new vehicle |
| `GET` | `/api/v1/vehicles` | List all user vehicles |
| `GET` | `/api/v1/vehicles/:id` | Get vehicle details |
| `PUT` | `/api/v1/vehicles/:id` | Update vehicle information / odometer |
| `DELETE` | `/api/v1/vehicles/:id` | Remove vehicle & associated logs |
| `POST` | `/api/v1/vehicles/:id/services` | Record new service log (Atomic Transaction) |
| `GET` | `/api/v1/vehicles/:id/services` | List service history for a vehicle |
| `DELETE` | `/api/v1/vehicles/:id/services/:logId` | Delete a service record |
| `GET` | `/api/v1/vehicles/:id/analytics` | Get vehicle health, spend, and next service estimate (Redis-cached) |

---

## 🧪 Running Tests

Unit tests cover JWT generation, expiration validation, failure edge cases, and password hashing security:

```bash
go test -v ./...
```

---

## 🛠️ Local Development & Setup

### 1. Clone & Setup Environment
```bash
cp .env.example .env
```

### 2. Start PostgreSQL and Redis via Docker Compose
```bash
docker-compose up -d
```

### 3. Run the Go Backend
```bash
go run ./cmd/api/main.go
```
The server will start on `http://localhost:8080`.

---

## 📦 Deployment (e.g. Railway / Render / DigitalOcean)

The project includes a multi-stage `Dockerfile`:
```bash
docker build -t autotrack .
docker run -p 8080:8080 autotrack
```
- In **Railway** or **Render**, connect this GitHub repository and supply your PostgreSQL and Redis connection strings as environment variables (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`).
