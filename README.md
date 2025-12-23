# English AI - Writing Practice

AI-powered English writing practice application built with Next.js, Prisma, and OpenAI.

## Features

- 🤖 **AI-Powered Feedback**: Get instant grammar corrections and improvement suggestions
- ✍️ **Interactive Writing**: Practice writing in conversational format on any topic
- 📚 **Mistake History**: Review and learn from your past errors
- 🎯 **Topic-Based Practice**: Choose your own topics for personalized learning

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Serverless Functions)
- **Database**: PostgreSQL (Vercel Postgres)
- **ORM**: Prisma
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd english-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
```

4. Initialize the database:
```bash
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Storage → Create Database → Postgres
3. Choose a region (Singapore - `sin1` recommended for Asia)
4. Copy the `DATABASE_URL` connection string

### 4. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Vercel Postgres connection string |
| `OPENAI_API_KEY` | Your OpenAI API key |

### 5. Deploy

```bash
# Link your project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 6. Run Database Migrations

After first deployment:
```bash
npx prisma migrate deploy
```

## Project Structure

```
english-ai/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── writing/       # Writing feature endpoints
│   ├── writing/           # Writing practice page
│   ├── history/           # Mistakes history page
│   └── page.tsx           # Home page
├── components/            # React components (future)
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client
│   └── openai.ts         # OpenAI client
├── services/             # Business logic
│   ├── aiService.ts      # AI interactions
│   └── writingService.ts # Writing feature logic
├── prisma/               # Database
│   └── schema.prisma     # Database schema
└── types/                # TypeScript types
```

## API Endpoints

- `POST /api/writing/start` - Start a new writing session
- `POST /api/writing/check` - Check user's sentence
- `GET /api/writing/history` - Get mistake history
- `GET /api/writing/sessions` - Get all sessions

## Features Roadmap

- [x] Basic writing practice
- [x] Grammar checking
- [x] Improvement suggestions
- [x] Mistake history
- [ ] User authentication
- [ ] Progress tracking
- [ ] Multiple difficulty levels
- [ ] Voice input
- [ ] Mobile app

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning and development.

## Acknowledgments

- OpenAI for providing the GPT API
- Vercel for hosting and database services
- Prisma for the excellent ORM

---

Built with ❤️ for English learners
