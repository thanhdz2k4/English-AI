# Project Structure - English AI

## Top Level Layout

```
english-ai/
|-- app/
|   |-- api/
|   |   |-- auth/
|   |   |   |-- login/
|   |   |   |-- logout/
|   |   |   |-- me/
|   |   |   `-- register/
|   |   |-- goals/
|   |   |   `-- route.ts
|   |   |-- tts/
|   |   |   `-- route.ts
|   |   `-- writing/
|   |       |-- check/
|   |       |-- history/
|   |       |-- sessions/
|   |       `-- start/
|   |-- goals/
|   |-- history/
|   |-- login/
|   |-- practice/
|   |-- register/
|   |-- writing/
|   |-- layout.tsx
|   `-- page.tsx
|-- components/
|-- lib/
|   |-- auth.ts
|   |-- openai.ts
|   `-- prisma.ts
|-- services/
|   |-- aiService.ts
|   |-- goalService.ts
|   |-- ttsService.ts
|   `-- writingService.ts
|-- types/
|-- prisma/
|   `-- schema.prisma
|-- docs/
|   |-- 01-project-overview.md
|   |-- 02-project-structure.md
|   |-- 03-progress-tracking.md
|   `-- 04-authentication.md
|-- package.json
`-- tsconfig.json
```

## App Routes

- `/` - Landing page
- `/writing` - Writing practice
- `/history` - Mistakes history
- `/practice` - Practice mistakes by topic
- `/flashcards` - Saved flashcards
- `/goals` - Personalized goals
- `/login` - Sign in
- `/register` - Create account

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
  goal      UserGoal?
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

model UserGoal {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  weeklySessionGoal Int      @default(3)
  reminderEnabled   Boolean  @default(false)
  reminderTime      String   @default("19:00")
  reminderTimezone  String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model WritingSession {
  id        String   @id @default(cuid())
  topic     String
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
  role      Role
  content   String
  isCorrect Boolean?
  improved  String?
  order     Int
  createdAt DateTime @default(now())
}

model Mistake {
  id          String   @id @default(cuid())
  sessionId   String
  session     WritingSession @relation(fields: [sessionId], references: [id])
  original    String
  correction  String
  explanation String
  reviewed    Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model Flashcard {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  sourceText  String
  translation String?
  sourceLang  String   @default("en")
  targetLang  String   @default("vi")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, sourceText])
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/writing/start` | Start a new session with a topic |
| `POST` | `/api/writing/check` | Check a user response and return feedback |
| `GET` | `/api/writing/history` | List mistakes for practice |
| `GET` | `/api/writing/sessions` | List completed sessions |

### Flashcards

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/flashcards` | List saved flashcards |
| `POST` | `/api/flashcards` | Save or update a flashcard |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account and set session cookie |
| `POST` | `/api/auth/login` | Sign in and set session cookie |
| `POST` | `/api/auth/logout` | Revoke session and clear cookie |
| `GET` | `/api/auth/me` | Return current session user |

### Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/goals` | Get weekly goals and progress |
| `POST` | `/api/goals` | Update weekly goals and reminders |

### Text to Speech (TTS)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tts` | Generate speech audio for AI responses |

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

// Response (incorrect)
{
  "isCorrect": false,
  "error": "Use past tense for a past action.",
  "suggestion": "I woke up at 7am."
}

// Response (correct)
{
  "isCorrect": true,
  "aiMessage": "That's great! What did you have for breakfast?",
  "improvement": "I woke up at 7 in the morning.",
  "messageCount": 3,
  "isCompleted": false
}
```

#### GET /api/writing/history
```json
// Response
{
  "mistakes": [
    {
      "id": "mistake_123",
      "original": "I go to school yesterday",
      "correction": "I went to school yesterday.",
      "explanation": "Use past tense for yesterday.",
      "createdAt": "2025-01-01T12:00:00.000Z",
      "topic": "daily life"
    }
  ]
}
```

#### GET /api/goals
```json
// Response
{
  "goal": {
    "weeklySessionGoal": 5,
    "reminderEnabled": true,
    "reminderTime": "19:00",
    "reminderTimezone": "Asia/Ho_Chi_Minh"
  },
  "progress": {
    "weeklyCompleted": 2,
    "streakDays": 4,
    "lastCompletedAt": "2025-01-02T08:00:00.000Z",
    "weekStart": "2024-12-30T00:00:00.000Z",
    "weekEnd": "2025-01-06T00:00:00.000Z"
  }
}
```

#### POST /api/tts
```json
// Request
{ "text": "Hello! How are you today?" }

// Response
{
  "audio": "BASE64_AUDIO_DATA",
  "mimeType": "audio/wav"
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

# Gemini (TTS) (use GEMINI_API_KEY or GOOGLE_API_KEY)
GEMINI_API_KEY="your_gemini_api_key_here"
GOOGLE_API_KEY="your_google_api_key_here"
GEMINI_MODEL="gemini-2.0-flash-exp"
GEMINI_TTS_MODEL="models/gemini-2.5-pro-preview-tts"
GEMINI_API_VERSION="v1alpha"
GEMINI_TTS_LANGUAGE="en-US"
GEMINI_TTS_VOICE=""

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
| Framework Preset | Next.js |
| Build Command | `prisma generate && next build` |
| Output Directory | `.next` |
| Install Command | `npm install` |
| Node.js Version | 18.x or 20.x |

### Environment Variables (Vercel Dashboard)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Vercel Postgres connection string | yes |
| `OPENAI_API_KEY` | OpenAI API key | yes |
| `OPENAI_BASE_URL` | OpenAI base URL | optional |
| `OPENAI_MODEL` | OpenAI model name | optional |
| `OPENAI_TIMEOUT_MS` | OpenAI request timeout in ms | optional |
| `OPENAI_MAX_RETRIES` | OpenAI request retries | optional |
| `VC_API_KEY` | Streamlake/Vanchin API key (fallback) | optional |
| `VC_BASE_URL` | Streamlake/Vanchin base URL | optional |
| `VC_MODEL` | Streamlake/Vanchin model ID | optional |
| `GEMINI_API_KEY` | Gemini API key for TTS | yes |
| `GOOGLE_API_KEY` | Google API key for Gemini (alternative) | optional |
| `GEMINI_MODEL` | Gemini model name | optional |
| `GEMINI_TTS_MODEL` | Gemini TTS model name | optional |
| `GEMINI_API_VERSION` | Gemini API version (recommended: `v1alpha` for TTS) | optional |
| `GEMINI_TTS_LANGUAGE` | TTS language code | optional |
| `GEMINI_TTS_VOICE` | TTS voice name | optional |
| `AUTH_COOKIE_NAME` | Cookie name for auth session | optional |
| `AUTH_SESSION_TTL_HOURS` | Session lifetime in hours | optional |
| `AUTH_PASSWORD_ITERATIONS` | PBKDF2 iterations for password hashing | optional |

### Vercel Postgres Setup

1. Open Vercel Dashboard -> Storage -> Create Database -> Postgres.
2. Choose the closest region (Singapore - `sin1`).
3. Copy `DATABASE_URL` into Environment Variables.
4. Run migrations:
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
