# English-AI - Hướng Dẫn Cú Pháp Code

## 📖 Mục Lục

1. [Tổng quan về công nghệ](#tổng-quan-về-công-nghệ)
2. [TypeScript trong dự án](#typescript-trong-dự-án)
3. [Cấu trúc file và folder](#cấu-trúc-file-và-folder)
4. [API Routes - Cú pháp cơ bản](#api-routes---cú-pháp-cơ-bản)
5. [React Components - Next.js App Router](#react-components---nextjs-app-router)
6. [Service Layer - Business Logic](#service-layer---business-logic)
7. [Database - Prisma ORM](#database---prisma-orm)
8. [Authentication - Cú pháp xử lý](#authentication---cú-pháp-xử-lý)
9. [AI Services - Cú pháp gọi AI](#ai-services---cú-pháp-gọi-ai)
10. [Utility Functions](#utility-functions)

---

## Tổng quan về công nghệ

Dự án sử dụng:
- **Next.js 16** với App Router (thư mục `app/`)
- **TypeScript** cho type safety
- **Prisma** làm ORM
- **Tailwind CSS** cho styling
- **React Server Components** và **Client Components**

---

## TypeScript trong dự án

### Basic Type Definitions

```typescript
// types/index.ts - File chứa tất cả type definitions

// Request types - Định nghĩa body gửi lên API
export interface StartSessionRequest {
  topic: string;
}

export interface CheckMessageRequest {
  sessionId: string;
  userMessage: string;
}

// Response types - Định nghĩa body trả về từ API
export interface StartSessionResponse {
  sessionId: string;
  aiMessage: string;
  messageCount: number;
}

export interface CheckMessageResponse {
  isCorrect: boolean;
  error?: string;         // optional - có thể có hoặc không
  suggestion?: string;
  aiMessage?: string;
  improvement?: string;
  messageCount?: number;
  isCompleted?: boolean;
}
```

### Union Types

```typescript
// Enum từ Prisma
enum Role {
  AI,      // Giáo viên AI
  USER,    // Người học
}

enum SessionStatus {
  IN_PROGRESS,  // Đang luyện tập
  COMPLETED     // Đã hoàn thành
}
```

---

## Cấu trúc file và folder

### Project Root

```
english-ai/
├── app/              # Next.js App Router - Routes chính
├── lib/              # Utility functions và clients
├── services/         # Business logic
├── types/            # TypeScript types
├── prisma/           # Database schema
└── docs/             # Documentation
```

### File Naming Conventions

| Loại file | Convention | Ví dụ |
|-----------|------------|-------|
| Page route | `page.tsx` | `app/writing/page.tsx` |
| Layout | `layout.tsx` | `app/layout.tsx` |
| API route | `route.ts` | `app/api/auth/login/route.ts` |
| Component | `*.tsx` | `components/Button.tsx` |
| Utility | `*.ts` | `lib/utils.ts` |
| Service | `*.ts` | `services/aiService.ts` |
| Types | `*.ts` | `types/index.ts` |

---

## API Routes - Cú pháp cơ bản

### Cấu trúc một API Route

```typescript
// app/api/endpoint/route.ts

import { NextRequest, NextResponse } from 'next/server';

// HTTP Method handlers
export async function GET(request: NextRequest) {
  // Xử lý GET request
  return NextResponse.json({ message: 'Hello' });
}

export async function POST(request: NextRequest) {
  // Xử lý POST request
  return NextResponse.json({ message: 'Created' }, { status: 201 });
}
```

### Ví dụ đầy đủ - Login API

```typescript
// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';           // Database client
import {
  createSession,
  getSessionCookieOptions,
  getSessionCookieName,
  verifyPassword,
} from '@/lib/auth';                            // Auth utilities

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    // 2. Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }  // Bad Request
      );
    }

    // 3. Query database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 4. Verify credentials
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }  // Unauthorized
      );
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 5. Create session
    const { token, expiresAt } = await createSession(user.id);
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });

    // 6. Set cookie
    response.cookies.set(
      getSessionCookieName(),
      token,
      getSessionCookieOptions(expiresAt)
    );

    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }  // Server Error
    );
  }
}
```

### Pattern Middleware cho Authentication

```typescript
// Pattern chung cho protected routes
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // 1. Check authentication
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Verify ownership (nếu cần)
  const session = await prisma.writingSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== user.id) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  // 3. Process logic
  // ...

  return NextResponse.json({ data: '...' });
}
```

---

## React Components - Next.js App Router

### Server Component (default)

```typescript
// app/page.tsx - Server Component (default)
// Không cần 'use client' directive

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1>English AI</h1>
      <Link href="/writing">Start Practice</Link>
    </div>
  );
}
```

### Client Component

```typescript
// app/writing/page.tsx - Client Component
// Cần 'use client' directive ở đầu file

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WritingPage() {
  // Hooks React chỉ dùng trong Client Component
  const [messages, setMessages] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch data khi component mount
  }, []);

  const handleAction = () => {
    // Event handlers
  };

  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### State Management Pattern

```typescript
'use client';

// Pattern quản lý state phức tạp
export default function MyComponent() {
  // 1. State cơ bản
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DataType | null>(null);

  // 2. Effect cho side effects
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/data');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError('Failed to fetch');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Dependencies array

  // 3. Conditional rendering
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {data && <div>{JSON.stringify(data)}</div>}
    </div>
  );
}
```

### Form Handling Pattern

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();  // Prevent default form submission
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Failed to sign in');
        return;
      }

      router.push('/writing');  // Redirect sau khi thành công
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
```

### Event Handlers với Callback

```typescript
'use client';

import { useCallback } from 'react';

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  // useCallback để memoize function
  const handlePlay = useCallback(async (text: string) => {
    if (isPlaying) return;
    setIsPlaying(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      // Play audio
      const audio = new Audio(`data:${data.mimeType};base64,${data.audio}`);
      await audio.play();
    } finally {
      setIsPlaying(false);
    }
  }, [isPlaying]);

  return (
    <button onClick={() => handlePlay("Hello")}>
      Play Audio
    </button>
  );
}
```

---

## Service Layer - Business Logic

### Cấu trúc một Service

```typescript
// services/exampleService.ts

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// Function đơn giản - lấy dữ liệu
export async function getData(userId: string) {
  return await prisma.someModel.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

// Function với parameter
export async function createData(userId: string, name: string) {
  return await prisma.someModel.create({
    data: {
      userId,
      name,
    },
  });
}

// Function với relation
export async function getDataWithRelations(id: string) {
  return await prisma.someModel.findUnique({
    where: { id },
    include: {
      user: true,
      relatedData: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}
```

### Ví dụ thực tế - writingService.ts

```typescript
// services/writingService.ts

import { prisma } from '@/lib/prisma';
import { Role, SessionStatus } from '@prisma/client';

// Tạo session mới
export async function createSession(userId: string, topic: string) {
  return await prisma.writingSession.create({
    data: {
      userId,
      topic,
      status: SessionStatus.IN_PROGRESS,  // Enum từ Prisma
    },
  });
}

// Thêm tin nhắn vào session
export async function addMessage(
  sessionId: string,
  role: Role,  // AI hoặc USER
  content: string,
  order: number,
  isCorrect?: boolean,    // Optional parameter
  improved?: string        // Optional parameter
) {
  return await prisma.message.create({
    data: {
      sessionId,
      role,
      content,
      order,
      isCorrect,
      improved,
    },
  });
}

// Lưu trữ lỗi
export async function addMistake(
  sessionId: string,
  original: string,
  correction: string,
  explanation: string
) {
  return await prisma.mistake.create({
    data: {
      sessionId,
      original,
      correction,
      explanation,
    },
  });
}

// Đếm số tin nhắn trong session
export async function getMessageCount(sessionId: string): Promise<number> {
  return await prisma.message.count({
    where: { sessionId },
  });
}

// Lấy tin nhắn theo thứ tự
export async function getSessionMessages(sessionId: string) {
  return await prisma.message.findMany({
    where: { sessionId },
    orderBy: { order: 'asc' },  // Sắp xếp theo order tăng dần
  });
}

// Đánh dấu session hoàn thành
export async function completeSession(sessionId: string) {
  return await prisma.writingSession.update({
    where: { id: sessionId },
    data: { status: SessionStatus.COMPLETED },
  });
}

// Lấy lỗi của user (với filtering)
export async function getUserMistakes(userId: string, reviewed: boolean = false) {
  return await prisma.mistake.findMany({
    where: {
      session: {
        userId,  // Filter thông qua relation
      },
      reviewed,
    },
    include: {
      session: {
        select: {
          topic: true,  // Chỉ lấy trường topic
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,  // Giới hạn 50 kết quả
  });
}
```

---

## Database - Prisma ORM

### Prisma Schema (.prisma/schema.prisma)

```prisma
// Kết nối database
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Generator cho client
generator client {
  provider = "prisma-client-js"
}

// Model definition
model User {
  id        String   @id @default(cuid())    // Auto-generate ID
  email     String   @unique                 // Unique constraint
  name      String?                         // Optional field
  createdAt DateTime @default(now())         // Default value
  updatedAt DateTime @updatedAt              // Auto-update timestamp
  
  // Relations
  sessions  WritingSession[]
  authSessions AuthSession[]
  goal      UserGoal?
}

// Enum definition
enum Role {
  AI
  USER
}

enum SessionStatus {
  IN_PROGRESS
  COMPLETED
}
```

### Prisma Client Singleton (lib/prisma.ts)

```typescript
// lib/prisma.ts - Singleton pattern để tránh multiple connections

import { PrismaClient } from '@prisma/client';

// Declare global property
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Export singleton instance
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// In development, attach to global to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Prisma Query Patterns

```typescript
import { prisma } from '@/lib/prisma';

// 1. Create - Tạo mới
const newUser = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    passwordHash: 'hashed_password',
  },
});

// 2. Find Unique - Tìm theo unique field
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});

// 3. Find Many - Tìm nhiều bản ghi
const users = await prisma.user.findMany({
  where: {
    createdAt: {
      gte: new Date('2024-01-01'),  // Greater than or equal
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 10,  // Limit
});

// 4. Update - Cập nhật
const updatedUser = await prisma.user.update({
  where: { id: 'user_id' },
  data: { name: 'New Name' },
});

// 5. Upsert - Update hoặc Create nếu không tồn tại
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { name: 'Updated Name' },
  create: {
    email: 'user@example.com',
    name: 'New User',
  },
});

// 6. Delete - Xóa
await prisma.user.delete({
  where: { id: 'user_id' },
});

// 7. Count - Đếm
const count = await prisma.user.count({
  where: { name: { contains: 'John' } },
});

// 8. With Relations
const userWithSessions = await prisma.user.findUnique({
  where: { id: 'user_id' },
  include: {
    sessions: {
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          take: 5,
        },
      },
    },
  },
});

// 9. Transactions - Thực hiện nhiều operations cùng lúc
await prisma.$transaction([
  prisma.user.create({ data: { email: 'a@test.com' } }),
  prisma.user.create({ data: { email: 'b@test.com' } }),
]);

// 10. Select fields - Chỉ lấy một số fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    // Không lấy passwordHash
  },
});
```

---

## Authentication - Cú pháp xử lý

### Hash Password (lib/auth.ts)

```typescript
// lib/auth.ts

import crypto from 'crypto';

const PASSWORD_ITERATIONS = 100000;  // Số lặp PBKDF2
const PASSWORD_SALT_BYTES = 16;       // Kích thước salt
const PASSWORD_KEYLEN = 64;          // Độ dài hash
const PASSWORD_DIGEST = 'sha512';     // Thuật toán hash

// Hash password khi đăng ký
export function hashPassword(password: string) {
  // 1. Tạo random salt
  const salt = crypto.randomBytes(PASSWORD_SALT_BYTES).toString('hex');
  
  // 2. Hash password với PBKDF2
  const hash = crypto
    .pbkdf2Sync(
      password,
      salt,
      PASSWORD_ITERATIONS,
      PASSWORD_KEYLEN,
      PASSWORD_DIGEST
    )
    .toString('hex');

  // 3. Trả về format: iterations:salt:hash
  return `${PASSWORD_ITERATIONS}:${salt}:${hash}`;
}
```

### Verify Password

```typescript
// lib/auth.ts

export function verifyPassword(password: string, storedHash: string) {
  try {
    // 1. Parse stored hash
    const [iterationsRaw, salt, expectedHash] = storedHash.split(':');
    const iterations = Number(iterationsRaw);
    
    if (!iterations || !salt || !expectedHash) return false;

    // 2. Hash input password với salt từ database
    const derived = crypto
      .pbkdf2Sync(
        password,
        salt,
        iterations,
        PASSWORD_KEYLEN,
        PASSWORD_DIGEST
      )
      .toString('hex');

    // 3. Timing-safe comparison (tránh timing attack)
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const derivedBuffer = Buffer.from(derived, 'hex');
    
    if (expectedBuffer.length !== derivedBuffer.length) return false;
    
    return crypto.timingSafeEqual(expectedBuffer, derivedBuffer);
  } catch {
    return false;
  }
}
```

### Session Management

```typescript
// lib/auth.ts

const SESSION_COOKIE_NAME = 'english_ai_session';
const SESSION_TTL_HOURS = 168;  // 7 ngày

// Tạo session mới
export async function createSession(userId: string) {
  // 1. Generate random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // 2. Hash token (SHA256)
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // 3. Calculate expiration
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000
  );

  // 4. Save to database
  await prisma.authSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  // 5. Return token và expiresAt
  return { token, expiresAt };
}

// Lấy user từ request
export async function getUserFromRequest(request: NextRequest) {
  // 1. Get token from cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return getUserFromToken(token);
}

// Lấy user từ token
export async function getUserFromToken(token?: string) {
  if (!token) return null;
  
  // 1. Hash token
  const tokenHash = hashToken(token);
  
  // 2. Query database
  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  // 3. Validate session
  if (!session || session.revokedAt) return null;
  
  if (session.expiresAt.getTime() <= Date.now()) {
    // Session expired - delete
    await prisma.authSession.delete({ where: { tokenHash } }).catch(() => null);
    return null;
  }

  return session.user;
}

// Revoke session
export async function revokeSessionByRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return;
  
  const tokenHash = hashToken(token);
  await prisma.authSession.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
```

### Cookie Operations

```typescript
// lib/auth.ts

// Lấy cookie options
export function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,                      // Không truy cập bằng JS
    secure: process.env.NODE_ENV === 'production',  // HTTPS only trong production
    sameSite: 'lax' as const,            // CSRF protection
    path: '/',
    expires: expiresAt,
  };
}

// Clear cookie
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),  // Set expiration về quá khứ
  });
}

// Set cookie trong API route
const response = NextResponse.json({ user: {...}});
response.cookies.set(
  getSessionCookieName(),
  token,
  getSessionCookieOptions(expiresAt)
);
```

---

## AI Services - Cú pháp gọi AI

### OpenAI Client Setup (lib/openai.ts)

```typescript
// lib/openai.ts

import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

// Singleton pattern cho OpenAI client
export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }
    
    const baseURL = process.env.OPENAI_BASE_URL;  // Optional
    const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS ?? 5000);
    const maxRetries = Number(process.env.OPENAI_MAX_RETRIES ?? 1);
    
    openaiInstance = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
      timeout: timeoutMs,
      maxRetries,
    });
  }
  return openaiInstance;
}
```

### Generate Initial Question (services/aiService.ts)

```typescript
import { getOpenAI } from '@/lib/openai';

const OPENAI_MODEL = 'gpt-4o-mini';  // Hoặc từ env variable

export async function generateInitialQuestion(topic: string): Promise<string> {
  try {
    const openai = getOpenAI();
    
    // Gọi OpenAI Chat Completions API
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an English teacher. Generate a simple question about "${topic}". Return only the question.`
        },
        {
          role: "user",
          content: `Create an opening question about: ${topic}`
        }
      ],
      temperature: 0.8,  // 0 = deterministic, 1 = very random
    });

    // Get AI response
    const content = completion.choices[0]?.message?.content;
    return content || "Hi! Let's talk about this topic.";
  } catch (error) {
    console.error('Error generating question:', error);
    return "Hi! Let's talk about this topic.";  // Fallback
  }
}
```

### Check Grammar (JSON Response)

```typescript
export async function checkGrammar(sentence: string): Promise<{
  isCorrect: boolean;
  error?: string;
  correction?: string;
}> {
  try {
    const openai = getOpenAI();
    
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `Check grammar and return JSON.
          If correct: {"isCorrect": true}
          If incorrect: {"isCorrect": false, "error": "explanation", "correction": "corrected"}`
        },
        {
          role: "user",
          content: sentence
        }
      ],
      temperature: 0.3,  // Low temperature cho accuracy
      response_format: { type: "json_object" }  // Force JSON response
    });

    // Parse JSON response
    const parsed = JSON.parse(
      completion.choices[0]?.message?.content || '{"isCorrect": true}'
    );

    return {
      isCorrect: parsed.isCorrect,
      error: parsed.error,
      correction: parsed.correction,
    };
  } catch (error) {
    console.error('Error checking grammar:', error);
    return { isCorrect: true };  // Fallback on error
  }
}
```

### Text-to-Speech with Google Gemini

```typescript
// services/ttsService.ts

import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }
  
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1alpha',
    });
  }
  return geminiClient;
}

export async function generateSpeech(
  text: string,
  options?: { languageCode?: string; voiceName?: string }
) {
  const client = getGeminiClient();
  
  const response = await client.models.generateContent({
    model: 'models/gemini-2.5-pro-preview-tts',
    contents: [
      {
        role: 'user',
        parts: [{ text }],
      },
    ],
    config: {
      responseModalities: ['audio'],  // Yêu cầu audio response
      speechConfig: {
        languageCode: options?.languageCode || 'en-US',
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: options?.voiceName,
          },
        },
      },
      systemInstruction: 'Read the text aloud in English.',
    },
  });

  // Extract audio from response
  const parts = response.candidates?.[0]?.content?.parts || [];
  const audioPart = parts.find((part) => {
    return part.inlineData?.mimeType?.startsWith('audio/');
  });

  const audio = audioPart?.inlineData?.data;
  const mimeType = audioPart?.inlineData?.mimeType || 'audio/wav';

  return { audio, mimeType };
}
```

---

## Utility Functions

### Tailwind Merge (lib/utils.ts)

```typescript
// lib/utils.ts - Merge classnames Tailwind một cách thông minh

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// clsx: conditionally join class names
// twMerge: intelligently merge Tailwind classes

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sử dụng trong component:
// className={cn('px-4 py-2', isActive && 'bg-blue-500', isDisabled && 'opacity-50')}
```

### String Utilities

```typescript
// Trim và lowercase email
const email = String(body.email ?? '').trim().toLowerCase();

// Validate email format
function isValidEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

// Normalize để so sánh
const normalize = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');  // Xóa extra spaces

// So sánh normalized strings
if (normalize(input) === normalize(correction)) {
  // Match!
}
```

### Date Utilities (từ goalService.ts)

```typescript
// Lấy ngày bắt đầu tuần (Thứ Hai)
function startOfWeekUtc(date: Date) {
  const day = date.getUTCDay();  // 0 = Sunday, 1 = Monday, etc.
  const diff = (day + 6) % 7;   // Convert sang Monday = 0
  const start = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - diff
  ));
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

// Format date key: '2024-01-01'
function dateKeyUtc(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate streak days
function calculateStreak(dates: Set<string>, today: Date) {
  const todayKey = dateKeyUtc(today);
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  const yesterdayKey = dateKeyUtc(yesterday);

  // Bắt đầu từ hôm nay hoặc hôm qua (nếu hôm nay không có)
  let current = dates.has(todayKey) ? today : yesterday;
  let currentKey = dateKeyUtc(current);
  if (!dates.has(currentKey)) return 0;

  let streak = 0;
  // Đếm ngược các ngày liên tiếp
  while (dates.has(currentKey)) {
    streak += 1;
    current.setUTCDate(current.getUTCDate() - 1);
    currentKey = dateKeyUtc(current);
  }
  return streak;
}
```

---

## Patterns và Best Practices

### 1. Async Function Pattern

```typescript
// Luôn try-catch cho async functions
export async function myFunction() {
  try {
    // Logic chính
    const data = await somethingAsync();
    return data;
  } catch (error) {
    console.error('Error in myFunction:', error);
    throw error;  // Re-throw hoặc return default
  }
}
```

### 2. Validation Pattern

```typescript
// Validate inputs đầu tiên
export async function createSomething(body: any) {
  // 1. Validate
  const name = String(body.name ?? '').trim();
  if (!name) {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 }
    );
  }

  if (name.length > 100) {
    return NextResponse.json(
      { error: 'Name too long' },
      { status: 400 }
    );
  }

  // 2. Process
  const result = await prisma.something.create({ data: { name } });
  
  return NextResponse.json(result);
}
```

### 3. Error Response Pattern

```typescript
// Pattern thống nhất cho error responses
if (!user) {
  return NextResponse.json(
    { error: 'User not found' },
    { status: 404 }
  );
}

// Parse error data
if (!response.ok) {
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(
    { error: data.error || 'Failed to fetch' },
    { status: response.status }
  );
}
```

### 4. Fetch Pattern in Client Components

```typescript
// Pattern fetch trong client component
const fetchData = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      if (response.status === 401) {
        router.push('/login');  // Redirect nếu chưa login
        return;
      }
      throw new Error('Failed to fetch');
    }
    
    const data = await response.json();
    setData(data);
  } catch (error) {
    console.error('Error:', error);
    setError('Failed to load data');
  } finally {
    setIsLoading(false);
  }
};
```

---

## Import Statements

### TypeScript Imports

```typescript
// Import từ thư viện
import { useState, useEffect, useCallback } from 'react';
import { NextRequest, NextResponse } from 'next/server';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Import từ dự án (sử dụng alias @)
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import type { User, WritingSession } from '@prisma/client';

// Import types
import type { StartSessionRequest, CheckMessageResponse } from '@/types';

// Import default export
import MyComponent from '@/components/MyComponent';
```

### Named Exports vs Default Exports

```typescript
// Named export - tốt cho utilities
export function helper() {}
export const CONSTANT = 'value';

// Import:
import { helper, CONSTANT } from './file';

// Default export - tốt cho components/pages
export default function MyPage() {}

// Import:
import MyPage from './file';
```

---

## TypeScript Type Annotations

### Function Return Types

```typescript
// Explicit return type
export async function getData(userId: string): Promise<User | null> {
  return await prisma.user.findUnique({ where: { id: userId } });
}

// Implicit return type (TypeScript sẽ tự infer)
export async function getData(userId: string) {
  return await prisma.user.findUnique({ where: { id: userId } });
}
```

### Parameter Types

```typescript
// Required parameters
function createUser(name: string, email: string) {}

// Optional parameters
function createUser(name: string, email?: string) {}

// Default parameters
function createUser(name: string, email = 'default@example.com') {}

// Destructured with types
function handleUpdate({ id, data }: { id: string, data: Partial<User> }) {}
```

---

## Conditional Rendering in JSX

```typescript
// Logical AND - render điều kiện
{isLoggedIn && <UserDashboard />}

// Ternary operator - render 2 trường hợp
{isLoading ? <Spinner /> : <Content />}

// Ternary với null
{error ? <Error message={error} /> : null}

// Multiple conditions
{!isLoading && !error && data && <Content data={data} />}
```

---

## Common Issues và Solutions

### 1. "React Hook has dependencies warning"

```typescript
// ❌ Không đúng
useEffect(() => {
  fetchData();
}, []);  // fetchData không được khai báo

// ✅ Đúng - useCallback để memoize
const fetchData = useCallback(async () => {
  // ...
}, [dependency]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

### 2. "Cannot find module" hoặc Alias không hoạt động

```typescript
// ❌ Sử dụng relative paths
import { prisma } from '../../lib/prisma';

// ✅ Sử dụng @ alias (cấu hình trong tsconfig.json)
import { prisma } from '@/lib/prisma';
```

### 3. Database connection pool exhausted

```typescript
// ✅ Sử dụng Prisma singleton pattern
// Đã triển khai trong lib/prisma.ts
import { prisma } from '@/lib/prisma';

// Không tạo new PrismaClient() trong mỗi file
```

---

## Tài Liệu Tham Khảo

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
