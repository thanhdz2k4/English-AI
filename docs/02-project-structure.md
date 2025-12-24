# Cấu Trúc Dự Án - English AI

## Cấu Trúc Thư Mục

```
english-ai/
├── 📁 src/
│   ├── 📁 app/                     # Next.js App Router
│   │   ├── 📁 api/                 # API Routes (Serverless Functions)
│   │   │   ├── 📁 writing/
│   │   │   │   ├── start/          # POST - Bắt đầu hội thoại mới
│   │   │   │   ├── check/          # POST - Kiểm tra câu trả lời
│   │   │   │   └── history/        # GET - Lấy lịch sử lỗi sai
│   │   │   └── 📁 auth/            # Xác thực người dùng
│   │   ├── 📁 writing/             # Trang Writing Feature
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── 📁 components/              # React Components
│   │   ├── 📁 writing/
│   │   │   ├── TopicInput.tsx      # Component nhập chủ đề
│   │   │   ├── ChatBubble.tsx      # Component tin nhắn
│   │   │   ├── UserInput.tsx       # Component nhập câu trả lời
│   │   │   ├── ErrorFeedback.tsx   # Component hiển thị lỗi
│   │   │   └── ImproveSuggestion.tsx # Component gợi ý cải thiện
│   │   └── 📁 ui/                  # UI Components chung
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Card.tsx
│   │
│   ├── 📁 lib/                     # Utilities & Helpers
│   │   ├── prisma.ts               # Prisma Client instance
│   │   ├── openai.ts               # OpenAI API config
│   │   └── utils.ts                # Helper functions
│   │
│   ├── 📁 services/                # Business Logic Layer
│   │   ├── writingService.ts       # Logic xử lý Writing feature
│   │   └── aiService.ts            # Tương tác với AI
│   │
│   └── 📁 types/                   # TypeScript Types
│       └── index.ts
│
├── 📁 prisma/
│   ├── schema.prisma               # Database Schema
│   └── 📁 migrations/              # Database Migrations
│
├── 📁 public/                      # Static Assets
│
├── 📁 docs/                        # Documentation
│   ├── ba.txt                      # Business Analysis
│   ├── 01-project-overview.md      # Tổng quan dự án
│   ├── 02-project-structure.md     # Cấu trúc dự án
│   └── 03-progress-tracking.md     # Theo dõi tiến độ
│
├── .env                            # Environment Variables
├── .env.example                    # Env Template
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

---

## Database Schema (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  passwordHash String?
  sessions  WritingSession[]
  authSessions AuthSession[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AuthSession {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())
}

model WritingSession {
  id        String   @id @default(cuid())
  topic     String                    // Chủ đề hội thoại
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  messages  Message[]
  mistakes  Mistake[]
  status    SessionStatus @default(IN_PROGRESS)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Message {
  id        String   @id @default(cuid())
  sessionId String
  session   WritingSession @relation(fields: [sessionId], references: [id])
  role      Role                      // AI hoặc USER
  content   String
  isCorrect Boolean?                  // null nếu là AI message
  improved  String?                   // Câu cải thiện (nếu đúng)
  order     Int                       // Thứ tự trong hội thoại
  createdAt DateTime @default(now())
}

model Mistake {
  id          String   @id @default(cuid())
  sessionId   String
  session     WritingSession @relation(fields: [sessionId], references: [id])
  original    String                  // Câu gốc của user
  correction  String                  // Câu đã sửa
  explanation String                  // Giải thích lỗi
  reviewed    Boolean  @default(false)
  createdAt   DateTime @default(now())
}

enum Role {
  AI
  USER
}

enum SessionStatus {
  IN_PROGRESS
  COMPLETED
}
```

---

## API Endpoints

### Writing Feature

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| `POST` | `/api/writing/start` | Bắt đầu session mới với topic |
| `POST` | `/api/writing/check` | Kiểm tra câu trả lời của user |
| `GET` | `/api/writing/history` | Lấy danh sách các câu sai để ôn tập |
| `GET` | `/api/writing/sessions` | Lấy danh sách các session đã hoàn thành |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account and set session cookie |
| `POST` | `/api/auth/login` | Sign in and set session cookie |
| `POST` | `/api/auth/logout` | Revoke session and clear cookie |
| `GET` | `/api/auth/me` | Return current session user |

### Request/Response Examples

#### POST /api/writing/start
```json
// Request
{ "topic": "daily life" }

// Response
{
  "sessionId": "session_abc",
  "aiMessage": "Hi! How was your morning today?",
  "messageCount": 1
}
```

#### POST /api/writing/check
```json
// Request
{
  "sessionId": "session_abc",
  "userMessage": "I wake up at 7am"
}

// Response (Sai)
{
  "isCorrect": false,
  "error": "Thiếu trợ động từ. Với thì quá khứ đơn, cần dùng 'woke up'.",
  "suggestion": "I woke up at 7am."
}

// Response (Đúng)
{
  "isCorrect": true,
  "aiMessage": "That's great! What did you have for breakfast?",
  "improvement": "I woke up at 7 in the morning.",
  "messageCount": 3,
  "isCompleted": false
}
```

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4o-mini"
OPENAI_TIMEOUT_MS="5000"
OPENAI_MAX_RETRIES="1"

# Streamlake / Vanchin (optional)
VC_API_KEY="your_vc_api_key_here"
VC_BASE_URL="https://vanchin.streamlake.ai/api/gateway/v1/endpoints"
VC_MODEL="kat-coder-exp-72b-1010"

# Vercel
VERCEL_URL="..."

# Auth
AUTH_COOKIE_NAME="english_ai_session"
AUTH_SESSION_TTL_HOURS="168"
AUTH_PASSWORD_ITERATIONS="100000"
```

---

## Vercel Deployment Configuration

### vercel.json

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sin1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Vercel Project Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Build Command** | `prisma generate && next build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |
| **Node.js Version** | 18.x hoặc 20.x |

### Environment Variables (Vercel Dashboard)

> [!IMPORTANT]
> Các biến môi trường cần được cấu hình trong Vercel Dashboard → Settings → Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Vercel Postgres connection string | ✅ |
| `OPENAI_API_KEY` | OpenAI API key | ✅ |
| `OPENAI_BASE_URL` | OpenAI base URL | optional |
| `OPENAI_MODEL` | OpenAI model name | optional |
| `OPENAI_TIMEOUT_MS` | OpenAI request timeout in ms | optional |
| `OPENAI_MAX_RETRIES` | OpenAI request retries | optional |
| `VC_API_KEY` | Streamlake/Vanchin API key (fallback) | optional |
| `VC_BASE_URL` | Streamlake/Vanchin base URL | optional |
| `VC_MODEL` | Streamlake/Vanchin model ID | optional |
| `AUTH_COOKIE_NAME` | Cookie name for auth session | optional |
| `AUTH_SESSION_TTL_HOURS` | Session lifetime in hours | optional |
| `AUTH_PASSWORD_ITERATIONS` | PBKDF2 iterations for password hashing | optional |

### Vercel Postgres Setup

1. Vào Vercel Dashboard → Storage → Create Database → Postgres
2. Chọn region gần nhất (Singapore - `sin1`)
3. Copy `DATABASE_URL` vào Environment Variables
4. Chạy migration:
   ```bash
   npx prisma migrate deploy
   ```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  }
}
```

### Lưu Ý Quan Trọng Khi Deploy

> [!CAUTION]
> - Không commit file `.env` lên Git
> - Đảm bảo `prisma generate` chạy trước khi build
> - API routes có giới hạn 10s (Hobby) hoặc 60s (Pro) execution time
> - Vercel Postgres có giới hạn connections, sử dụng connection pooling

### Deployment Commands

```bash
# Login Vercel CLI
npx vercel login

# Link project
npx vercel link

# Deploy preview
npx vercel

# Deploy production
npx vercel --prod

# Pull environment variables
npx vercel env pull .env.local
```
