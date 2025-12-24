# Authentication and Accounts

## Overview

This project now includes a simple email/password login flow with a server-side
session cookie. All writing endpoints use the authenticated user and no longer
accept a `userId` from the client.

## Database Changes

Prisma schema updates:

- `User.passwordHash` stores the salted password hash.
- `AuthSession` stores session tokens (hashed), expiry, and optional revoke time.

```prisma
model User {
  id           String        @id @default(cuid())
  email        String        @unique
  name         String?
  passwordHash String?
  sessions     WritingSession[]
  authSessions AuthSession[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
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
```

## API Endpoints

### POST /api/auth/register

Request:
```json
{
  "email": "you@example.com",
  "password": "yourpassword",
  "name": "Optional Name"
}
```

Response:
```json
{
  "user": {
    "id": "user_abc",
    "email": "you@example.com",
    "name": "Optional Name"
  }
}
```

### POST /api/auth/login

Request:
```json
{
  "email": "you@example.com",
  "password": "yourpassword"
}
```

### POST /api/auth/logout

Clears the session cookie and revokes the session server-side.

### GET /api/auth/me

Returns the current user if a valid session exists.

## Environment Variables

```env
AUTH_COOKIE_NAME="english_ai_session"
AUTH_SESSION_TTL_HOURS="168"
AUTH_PASSWORD_ITERATIONS="100000"
```

## Frontend Pages

- `/login` for sign-in
- `/register` for account creation
- `/writing` and `/history` require a valid session

## Migration Steps

After updating the schema, apply database changes:

```bash
npx prisma db push
npx prisma generate
```

Or if you use migrations:

```bash
npx prisma migrate dev -n add-auth
npx prisma generate
```
