# 🚀 Quick Start Guide - English AI

## Prerequisites
- Java 17+
- Maven 3.8+
- Node.js 18+
- Docker Desktop (recommended)
- PostgreSQL 15 (or use Docker)

---

## Option 1: Quick Start with Docker (Recommended) 🐳

### Step 1: Setup Environment Variables
```powershell
cd infrastructure\docker
Copy-Item .env.example .env
```

### Step 2: Edit `.env` file
Open `.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Step 3: Start All Services
```powershell
docker-compose up -d
```

### Step 4: Start Frontend
```powershell
cd ..\..\frontend
npm install
npm run dev
```

### ✅ Done! 
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- PostgreSQL: localhost:5432

---

## Option 2: Manual Development Setup 💻

### Step 1: Start PostgreSQL

#### Using Docker:
```powershell
docker run -d `
  --name english-ai-postgres `
  -e POSTGRES_DB=english_ai_db `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -p 5432:5432 `
  postgres:15-alpine
```

#### Using Local PostgreSQL:
```powershell
createdb english_ai_db
psql -d english_ai_db -f database\migrations\V1__init_database.sql
```

### Step 2: Start Backend Services

Open 4 separate PowerShell terminals:

#### Terminal 1 - User Service (Port 8082)
```powershell
cd backend\user-service
$env:JWT_SECRET="your-secret-key-minimum-256-bits"
mvn spring-boot:run
```

#### Terminal 2 - Writing Service (Port 8081)
```powershell
cd backend\writing-service
mvn spring-boot:run
```

#### Terminal 3 - AI Service (Port 8083)
```powershell
cd backend\ai-service
$env:OPENAI_API_KEY="sk-your-api-key-here"
mvn spring-boot:run
```

#### Terminal 4 - API Gateway (Port 8080)
```powershell
cd backend\api-gateway
mvn spring-boot:run
```

### Step 3: Start Frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

### ✅ Done!
Access the application at: http://localhost:3000

---

## 🔍 Verify Installation

### Check Backend Services
```powershell
# API Gateway health
curl http://localhost:8080/actuator/health

# User Service health
curl http://localhost:8082/actuator/health

# Writing Service health
curl http://localhost:8081/actuator/health

# AI Service health
curl http://localhost:8083/actuator/health
```

### Check Database
```powershell
# Connect to PostgreSQL
psql -h localhost -U postgres -d english_ai_db

# List tables
\dt

# Exit
\q
```

---

## 📦 Build Project

### Build All Services
```powershell
.\infrastructure\scripts\build.ps1
```

### Build Individual Service
```powershell
cd backend\user-service
mvn clean package
```

### Build Frontend
```powershell
cd frontend
npm run build
```

---

## 🛑 Stop Services

### Stop Docker Compose
```powershell
cd infrastructure\docker
docker-compose down
```

### Stop Manual Services
Press `Ctrl+C` in each terminal running a service

---

## 🐛 Troubleshooting

### Port Already in Use
If you get "Port already in use" error:

```powershell
# Find process using port (example: 8080)
netstat -ano | findstr :8080

# Kill process by PID
taskkill /PID <PID> /F
```

### Database Connection Error
1. Check PostgreSQL is running:
   ```powershell
   docker ps | findstr postgres
   ```

2. Check connection:
   ```powershell
   psql -h localhost -U postgres -d english_ai_db
   ```

### Maven Build Error
1. Clean Maven cache:
   ```powershell
   mvn clean
   ```

2. Update dependencies:
   ```powershell
   mvn clean install -U
   ```

### Frontend Error
1. Clear node_modules:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

2. Clear Vite cache:
   ```powershell
   Remove-Item -Recurse -Force .vite
   npm run dev
   ```

---

## 📝 Next Steps

1. ✅ Phase 1 Complete - Infrastructure Setup
2. ⏭️ Phase 2 - Implement User Service
3. ⏭️ Phase 3 - Implement Writing Service
4. ⏭️ Phase 4 - Implement AI Service

See [progress-tracking.md](../docs/progress-tracking.md) for detailed roadmap.

---

## 🆘 Need Help?

- 📚 Check [README.md](../README.md) for full documentation
- 📋 Review [project-description.md](../docs/project-description.md)
- 🏗️ See [project-structure.md](../docs/project-structure.md)

---

Made with ❤️ by English AI Team
