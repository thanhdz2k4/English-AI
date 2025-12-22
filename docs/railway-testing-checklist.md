# 🧪 Railway Testing Checklist

## ✅ Các bước test sau khi deploy

### 1. Kiểm tra Deployment Status
- [ ] Vào Railway Dashboard
- [ ] Kiểm tra tab **Deployments** 
- [ ] Đảm bảo status là **Active** (màu xanh lá)
- [ ] Không có lỗi trong build logs

### 2. Enable Public Domain
Mỗi service cần public domain để test:

#### API Gateway (Bắt buộc)
- [ ] Vào service **API Gateway**
- [ ] Settings → Networking → **Generate Domain**
- [ ] Copy domain: `https://api-gateway-production-xxx.up.railway.app`

#### Frontend (Bắt buộc)
- [ ] Vào service **Frontend**
- [ ] Settings → Networking → **Generate Domain**
- [ ] Copy domain: `https://frontend-production-xxx.up.railway.app`

#### Backend Services (Optional - chỉ test qua Gateway)
- User Service, Writing Service, AI Service không cần public domain
- Test qua API Gateway thay vì direct access

### 3. Kiểm tra Environment Variables

#### Database Service
```bash
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=5432
PGUSER=postgres
PGPASSWORD=...
```

#### API Gateway
```bash
PORT=8080
SPRING_PROFILES_ACTIVE=production
USER_SERVICE_URL=http://user-service.railway.internal:8082
WRITING_SERVICE_URL=http://writing-service.railway.internal:8081
AI_SERVICE_URL=http://ai-service.railway.internal:8083
```

#### User Service
```bash
PORT=8082
SPRING_PROFILES_ACTIVE=production
SPRING_DATASOURCE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-secret-key
```

#### Writing Service
```bash
PORT=8081
SPRING_PROFILES_ACTIVE=production
SPRING_DATASOURCE_URL=${{Postgres.DATABASE_URL}}
AI_SERVICE_URL=http://ai-service.railway.internal:8083
```

#### AI Service
```bash
PORT=8083
SPRING_PROFILES_ACTIVE=production
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-3.5-turbo
```

#### Frontend
```bash
PORT=3000
NODE_ENV=production
VITE_API_URL=https://api-gateway-production-xxx.up.railway.app
```

### 4. Test Health Endpoints

Sau khi có domain, test các endpoint:

```powershell
# Test API Gateway
curl https://api-gateway-production-xxx.up.railway.app/actuator/health

# Expected: {"status":"UP"}
```

```powershell
# Test User Service qua Gateway
curl https://api-gateway-production-xxx.up.railway.app/api/auth/health

# Expected: 200 OK hoặc service info
```

```powershell
# Test Writing Service qua Gateway
curl https://api-gateway-production-xxx.up.railway.app/api/sessions/health

# Expected: 200 OK
```

```powershell
# Test AI Service qua Gateway
curl https://api-gateway-production-xxx.up.railway.app/api/ai/health

# Expected: 200 OK
```

### 5. Test Complete Flow

#### 5.1. Register User
```powershell
curl -X POST https://api-gateway-production-xxx.up.railway.app/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

#### 5.2. Login
```powershell
curl -X POST https://api-gateway-production-xxx.up.railway.app/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

#### 5.3. Create Writing Session
```powershell
$token = "your-jwt-token-here"
curl -X POST https://api-gateway-production-xxx.up.railway.app/api/sessions `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "topic": "Daily Life"
  }'
```

#### 5.4. Send Response
```powershell
curl -X POST https://api-gateway-production-xxx.up.railway.app/api/sessions/1/respond `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "userResponse": "I wake up at 7 o clock every day"
  }'
```

### 6. Test Frontend

#### 6.1. Open Browser
```
https://frontend-production-xxx.up.railway.app
```

#### 6.2. Test Flow
- [ ] Đăng ký tài khoản mới
- [ ] Đăng nhập
- [ ] Nhập topic "Daily Life"
- [ ] Viết câu trả lời
- [ ] Kiểm tra phản hồi từ AI
- [ ] Xem lại mistake review page

### 7. Check Logs

Nếu có lỗi, kiểm tra logs:

```powershell
# Railway CLI
railway logs --service api-gateway
railway logs --service user-service
railway logs --service writing-service
railway logs --service ai-service
railway logs --service frontend
```

Hoặc trên Dashboard:
- Vào service → Tab **Deployments** → Click vào deployment → Xem logs

### 8. Common Issues & Solutions

#### Issue 1: Cannot GET /
**Cause:** Service chưa có public domain hoặc port không đúng

**Solution:**
- Generate domain trong Settings → Networking
- Kiểm tra `server.port` trong application.yml
- Đảm bảo service expose đúng port: `${PORT:8080}`

#### Issue 2: 502 Bad Gateway
**Cause:** Service crash hoặc chưa start

**Solution:**
- Kiểm tra logs trong Deployments
- Verify environment variables
- Kiểm tra database connection

#### Issue 3: CORS Error
**Cause:** Frontend domain chưa được add vào CORS config

**Solution:**
Update API Gateway `application.yml`:
```yaml
spring:
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowed-origins:
              - "https://frontend-production-xxx.up.railway.app"
```

#### Issue 4: Database Connection Failed
**Cause:** DATABASE_URL sai hoặc Postgres chưa chạy

**Solution:**
- Verify `${{Postgres.DATABASE_URL}}` trong env vars
- Kiểm tra Postgres service status
- Run migration scripts

#### Issue 5: AI Service Timeout
**Cause:** OPENAI_API_KEY không hợp lệ hoặc quota exceeded

**Solution:**
- Verify OPENAI_API_KEY
- Check OpenAI account balance
- Kiểm tra rate limits

### 9. Performance Testing

```powershell
# Test response time
Measure-Command { 
  curl https://api-gateway-production-xxx.up.railway.app/api/auth/health 
}

# Expected: < 500ms
```

### 10. Security Checklist

- [ ] JWT_SECRET đã thay đổi khỏi default
- [ ] OPENAI_API_KEY được lưu trong environment variables (không commit vào code)
- [ ] Database password strong và secure
- [ ] HTTPS enabled (Railway auto)
- [ ] CORS chỉ cho phép frontend domain
- [ ] Rate limiting enabled

---

## 📊 Test Results Template

| Test Case | Status | Notes |
|-----------|--------|-------|
| API Gateway Health | ⬜ | |
| User Service Health | ⬜ | |
| Writing Service Health | ⬜ | |
| AI Service Health | ⬜ | |
| Register User | ⬜ | |
| Login User | ⬜ | |
| Create Session | ⬜ | |
| Send Response | ⬜ | |
| AI Grammar Check | ⬜ | |
| Frontend Load | ⬜ | |
| End-to-End Flow | ⬜ | |

---

## 🎉 Success Criteria

✅ Tất cả services status = **Active**  
✅ All health endpoints return **200 OK**  
✅ User có thể register & login  
✅ Writing session được tạo thành công  
✅ AI response trong < 3 giây  
✅ Frontend load và hoạt động mượt  
✅ No errors trong logs  

**🚀 Nếu đạt được tất cả, dự án đã deploy thành công!**
