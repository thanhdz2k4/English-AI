# 🚀 Quick Start Guide - English AI

## Production Deployment

✅ **Live URL**: https://english-ai-three.vercel.app

---

## 🔴 CRITICAL: Complete Setup (Required)

Your app is deployed but needs configuration to work properly.

### Step 1: Setup Database

1. Go to [Vercel Dashboard](https://vercel.com/thanhdz2k4s-projects/english-ai)
2. Click **Storage** tab
3. Click **Create Database** → Select **Postgres**
4. Choose region: **Singapore (sin1)**
5. Click **Create**
6. Copy the **`DATABASE_URL`** connection string

### Step 2: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-...`)

### Step 3: Add Environment Variables

1. Go to [Project Settings](https://vercel.com/thanhdz2k4s-projects/english-ai/settings/environment-variables)
2. Add these variables for **Production**, **Preview**, and **Development**:

```
DATABASE_URL = [paste your Vercel Postgres URL]
OPENAI_API_KEY = [paste your OpenAI key]
```

3. Click **Save**

### Step 4: Run Database Migration

Open terminal and run:

```bash
cd "e:\Githup Project\English-AI"
npx prisma migrate deploy
```

### Step 5: Redeploy

```bash
vercel --prod
```

### Step 6: Test!

Visit https://english-ai-three.vercel.app and test the writing practice feature!

---

## 📱 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database (or use Vercel Postgres)
- OpenAI API key

### Setup

1. Clone and install:
```bash
cd "e:\Githup Project\English-AI"
npm install
```

2. Create `.env` file:
```bash
DATABASE_URL="your_postgres_url"
OPENAI_API_KEY="your_openai_key"
```

3. Run migrations:
```bash
npx prisma migrate dev
```

4. Start development server:
```bash
npm run dev
```

5. Open http://localhost:3000

---

## 🎯 How to Use

1. **Home Page**: Overview of features
2. **Start Writing Practice**: 
   - Enter a topic (e.g., "daily life", "hobbies")
   - AI will start a conversation
   - Write responses in English
   - Get instant grammar feedback
3. **View Mistakes**: Review your errors to improve

---

## 📚 Key Features

- ✍️ Interactive writing practice
- 🤖 AI grammar checking
- 💡 Improvement suggestions
- 📊 Mistake tracking
- 🌙 Dark mode support
- 📱 Responsive design

---

## 🔧 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Create new migration
npx prisma migrate deploy # Deploy migrations

# Deployment
vercel                   # Deploy preview
vercel --prod            # Deploy production
vercel logs              # View logs
```

---

## 🆘 Troubleshooting

### App shows errors
- Check environment variables are set in Vercel Dashboard
- Verify DATABASE_URL is correct
- Ensure migrations are run

### Database errors
- Make sure Vercel Postgres is created
- Run `npx prisma migrate deploy`
- Check connection string format

### OpenAI errors
- Verify API key is valid
- Check you have credits in OpenAI account
- Ensure key starts with `sk-`

---

## 📞 Support

If you encounter issues:
1. Check [Vercel Logs](https://vercel.com/thanhdz2k4s-projects/english-ai/logs)
2. Review [DEPLOYMENT.md](DEPLOYMENT.md) for detailed info
3. Check environment variables are set correctly

---

**Status**: 🟢 Deployed and Ready (after configuration)
**Next**: Configure environment variables and test!
