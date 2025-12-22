# 🚀 Railway Deployment Guide - English AI

## 📋 Tổng Quan

Hướng dẫn deploy dự án **English AI** lên Railway với kiến trúc microservices.

### Services cần deploy:
1. ✅ **PostgreSQL Database** (Railway Plugin)
2. ✅ **API Gateway** (Port 8080)
3. ✅ **User Service** (Port 8082)
4. ✅ **Writing Service** (Port 8081)
5. ✅ **AI Service** (Port 8083)
6. ✅ **Frontend** (React/Vite)

---

## 🎯 Bước 1: Chuẩn Bị

### 1.1. Tạo Railway Account
- Truy cập: https://railway.app/
- Đăng ký bằng GitHub account
- Kết nối repository `English-AI`

### 1.2. Cài đặt Railway CLI (Optional)
```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 -useb | iex

# Verify installation
railway --version

# Login
railway login
```

---

## 🗄️ Bước 2: Setup Database

### 2.1. Tạo PostgreSQL Database
1. Vào Railway Dashboard
2. Click **"New Project"** → **"Provision PostgreSQL"**
3. Database sẽ được tạo tự động
4. Copy các thông tin:
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`

### 2.2. Kết nối và Migrate Database
```bash
# Option 1: Sử dụng Railway CLI
railway connect postgres

# Option 2: Sử dụng psql
psql -h <PGHOST> -U <PGUSER> -d <PGDATABASE>

# Run migration script
\i database/migrations/V1__init_database.sql
```

### 2.3. Lưu Connection String
```
DATABASE_URL=postgresql://<PGUSER>:<PGPASSWORD>@<PGHOST>:<PGPORT>/<PGDATABASE>
```

---

## 🔧 Bước 3: Deploy Backend Services

### 3.1. Deploy User Service

1. **Create New Service**
   - Click **"New"** → **"GitHub Repo"**
   - Chọn repository `English-AI`
   - Root Directory: `/backend/user-service`

2. **Configure Environment Variables**
   ```bash
   SPRING_PROFILES_ACTIVE=production
   SPRING_DATASOURCE_URL=${{Postgres.DATABASE_URL}}
   SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
   SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}
   JWT_SECRET=your-jwt-secret-minimum-256-bits
   PORT=8082
   ```

3. **Configure Build Settings**
   - Builder: `NIXPACKS`
   - Build Command: `mvn clean package -DskipTests`
   - Start Command: `java -jar target/user-service-1.0.0.jar`

4. **Deploy**
   - Click **"Deploy"**
   - Wait for build to complete
   - Copy service URL: `https://user-service-xxx.railway.app`

### 3.2. Deploy Writing Service

1. **Create New Service**
   - Root Directory: `/backend/writing-service`

2. **Configure Environment Variables**
   ```bash
   SPRING_PROFILES_ACTIVE=production
   SPRING_DATASOURCE_URL=${{Postgres.DATABASE_URL}}
   SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
   SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}
   AI_SERVICE_URL=${{AI_Service.RAILWAY_PUBLIC_DOMAIN}}
   PORT=8081
   ```

3. **Deploy**

### 3.3. Deploy AI Service

1. **Create New Service**
   - Root Directory: `/backend/ai-service`

2. **Configure Environment Variables**
   ```bash
   SPRING_PROFILES_ACTIVE=production
   OPENAI_API_KEY=sk-your-openai-api-key
   OPENAI_MODEL=gpt-3.5-turbo
   PORT=8083
   ```

3. **Deploy**

### 3.4. Deploy API Gateway

1. **Create New Service**
   - Root Directory: `/backend/api-gateway`

2. **Configure Environment Variables**
   ```bash
   SPRING_PROFILES_ACTIVE=production
   USER_SERVICE_URL=${{User_Service.RAILWAY_PUBLIC_DOMAIN}}
   WRITING_SERVICE_URL=${{Writing_Service.RAILWAY_PUBLIC_DOMAIN}}
   AI_SERVICE_URL=${{AI_Service.RAILWAY_PUBLIC_DOMAIN}}
   PORT=8080
   ```

3. **Deploy**
4. **Enable Public Domain**
   - Settings → Networking → Generate Domain
   - Copy URL: `https://api-gateway-xxx.railway.app`

---

## 🎨 Bước 4: Deploy Frontend

### 4.1. Create Frontend Service

1. **Create New Service**
   - Root Directory: `/frontend`

2. **Configure Environment Variables**
   ```bash
   NODE_ENV=production
   VITE_API_URL=${{API_Gateway.RAILWAY_PUBLIC_DOMAIN}}
   PORT=3000
   ```

3. **Configure Build Settings**
   - Builder: `NIXPACKS`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview -- --host 0.0.0.0 --port $PORT`

4. **Deploy**
5. **Enable Public Domain**
   - Copy URL: `https://english-ai-xxx.railway.app`

---

## 🔗 Bước 5: Kết Nối Services

### 5.1. Service Dependencies
Railway tự động tạo private network giữa các services:

```
Frontend ────> API Gateway ────┬────> User Service ────> PostgreSQL
                                │
                                ├────> Writing Service ──> PostgreSQL
                                │            │
                                └────> AI Service
                                             │
                                         OpenAI API
```

### 5.2. Update CORS Configuration

Cập nhật `api-gateway/src/main/resources/application.yml`:

```yaml
spring:
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowed-origins: 
              - "https://english-ai-xxx.railway.app"
            allowed-methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
            allowed-headers: "*"
            allow-credentials: true
```

---

## ✅ Bước 6: Verification

### 6.1. Kiểm Tra Health Endpoints

```bash
# API Gateway
curl https://api-gateway-xxx.railway.app/actuator/health

# User Service
curl https://api-gateway-xxx.railway.app/api/users/health

# Writing Service
curl https://api-gateway-xxx.railway.app/api/sessions/health

# AI Service
curl https://api-gateway-xxx.railway.app/api/ai/health
```

### 6.2. Test End-to-End Flow

1. Mở frontend: `https://english-ai-xxx.railway.app`
2. Register user mới
3. Login
4. Tạo writing session
5. Test AI response

---

## 📊 Bước 7: Monitoring & Logging

### 7.1. Railway Dashboard
- View logs cho từng service
- Monitor CPU/Memory usage
- Check deployment history

### 7.2. Application Logs
```bash
# View logs của service
railway logs --service user-service

# Follow logs realtime
railway logs --service user-service --follow
```

---

## 💰 Bước 8: Cost Optimization

### 8.1. Railway Pricing (Ước tính)

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| PostgreSQL | Shared | $5 |
| API Gateway | Hobby | $5 |
| User Service | Hobby | $5 |
| Writing Service | Hobby | $5 |
| AI Service | Hobby | $5 |
| Frontend | Hobby | $5 |
| **Total** | | **~$30/month** |

### 8.2. Optimization Tips

1. **Reduce Service Count** (Phase 2)
   - Merge microservices thành monolith nếu traffic thấp
   - Ước tính: $15/month (1 backend + 1 frontend + DB)

2. **Auto-sleep Inactive Services**
   - Railway tự động sleep services không active
   - Chỉ pay cho uptime thực tế

3. **Use Free Tier**
   - Railway free tier: $5 credit/month
   - Good cho testing/development

---

## 🔐 Bước 9: Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Secure OPENAI_API_KEY
- [ ] Enable HTTPS (Railway auto)
- [ ] Configure rate limiting
- [ ] Setup monitoring alerts
- [ ] Enable database backups
- [ ] Review CORS policies

---

## 🐛 Troubleshooting

### Service không start được

**Problem:** Service crash khi deploy

**Solution:**
```bash
# Check logs
railway logs --service <service-name>

# Common issues:
# 1. Wrong Java version → Set JAVA_VERSION=17
# 2. Missing environment variables → Check .env.example
# 3. Database connection failed → Verify DATABASE_URL
```

### Database connection timeout

**Problem:** Cannot connect to PostgreSQL

**Solution:**
1. Check Postgres service is running
2. Verify DATABASE_URL format
3. Ensure services are in same Railway project

### Frontend không gọi được API

**Problem:** CORS error hoặc 404

**Solution:**
1. Verify VITE_API_URL is correct
2. Check API Gateway CORS config
3. Ensure API Gateway has public domain

---

## 📚 Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Templates](https://railway.app/templates)
- [Spring Boot on Railway](https://docs.railway.app/guides/spring)
- [React on Railway](https://docs.railway.app/guides/react)

---

## 📅 Deployment Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Setup | 30 min | Create Railway account, setup database |
| Backend | 1 hour | Deploy 4 microservices |
| Frontend | 30 min | Deploy React app |
| Configuration | 30 min | Environment variables, CORS |
| Testing | 30 min | End-to-end verification |
| **Total** | **~3 hours** | First-time deployment |

---

## 🎉 Next Steps

1. ✅ Complete deployment
2. 📊 Setup monitoring
3. 🔄 Configure CI/CD (GitHub Actions)
4. 🌐 Setup custom domain
5. 📱 Add SSL certificate (auto by Railway)
6. 🚀 Launch to users!

---

> 💡 **Pro Tip:** Sử dụng Railway CLI để deploy nhanh hơn!
> 
> ```bash
> # Deploy all services with one command
> railway up
> ```

**Good luck with your deployment! 🚀**
