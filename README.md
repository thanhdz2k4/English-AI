# 📚 English AI - Writing Practice Application

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-green)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

An AI-powered English writing practice application that helps users improve their writing skills through interactive conversations with AI feedback.

## 🎯 Features

- ✍️ **Writing Practice**: Interactive AI conversations to practice English writing
- 🔍 **Grammar Check**: Real-time grammar and spelling correction
- 💡 **Improvement Suggestions**: Get AI-powered suggestions to improve your writing
- 📊 **Mistake Review**: Track and review your past mistakes
- 📈 **Progress Tracking**: Monitor your improvement over time

## 🏗️ Architecture

This project uses a **microservices architecture** with the following components:

```
┌─────────────┐
│   Frontend  │  React (Port 3000)
│   (React)   │
└──────┬──────┘
       │
┌──────▼──────┐
│ API Gateway │  Spring Cloud Gateway (Port 8080)
└──────┬──────┘
       │
   ┌───┴────┬────────────┬───────────┐
   │        │            │           │
┌──▼──┐ ┌──▼──┐ ┌───────▼──┐ ┌──────▼──┐
│User │ │Write│ │    AI    │ │Database │
│Svc  │ │Svc  │ │  Service │ │Postgres │
│8082 │ │8081 │ │   8083   │ │  5432   │
└─────┘ └─────┘ └──────────┘ └─────────┘
```

## 🛠️ Tech Stack

### Backend
- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Cloud Gateway** (API Gateway)
- **Spring Data JPA** (Database access)
- **PostgreSQL 15** (Database)
- **JWT** (Authentication)

### Frontend
- **React 18.2.0**
- **Vite** (Build tool)
- **React Router** (Routing)
- **Axios** (HTTP client)
- **Zustand** (State management)

### DevOps
- **Docker & Docker Compose**
- **Railway** (Deployment)
- **Maven** (Build tool)

## 📋 Prerequisites

Before running this project, make sure you have installed:

- **Java 17+**
- **Maven 3.8+**
- **Node.js 18+**
- **Docker & Docker Compose**
- **PostgreSQL 15** (or use Docker)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/english-ai.git
cd english-ai
```

### 2. Setup Environment Variables

#### Backend Services
Copy the example environment file:

```bash
cd infrastructure/docker
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Database
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secret (minimum 256 bits)
JWT_SECRET=your-secret-key-here

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key
```

#### Frontend
```bash
cd frontend
cp .env.example .env
```

### 3. Start with Docker Compose (Recommended)

```bash
cd infrastructure/docker
docker-compose up -d
```

This will start:
- PostgreSQL (Port 5432)
- User Service (Port 8082)
- Writing Service (Port 8081)
- AI Service (Port 8083)
- API Gateway (Port 8080)

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 5. Manual Setup (Without Docker)

#### Start PostgreSQL
```bash
# Create database
createdb english_ai_db

# Run migrations
psql -d english_ai_db -f database/migrations/V1__init_database.sql
```

#### Start Backend Services

Terminal 1 - User Service:
```bash
cd backend/user-service
mvn spring-boot:run
```

Terminal 2 - Writing Service:
```bash
cd backend/writing-service
mvn spring-boot:run
```

Terminal 3 - AI Service:
```bash
cd backend/ai-service
mvn spring-boot:run
```

Terminal 4 - API Gateway:
```bash
cd backend/api-gateway
mvn spring-boot:run
```

#### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
english-ai/
├── backend/
│   ├── api-gateway/          # API Gateway (Port 8080)
│   ├── user-service/         # User Management (Port 8082)
│   ├── writing-service/      # Writing Practice (Port 8081)
│   └── ai-service/           # AI Integration (Port 8083)
├── frontend/                 # React Frontend (Port 3000)
├── database/                 # Database migrations
├── infrastructure/           # Docker & deployment configs
├── docs/                     # Documentation
├── pom.xml                   # Parent Maven POM
└── README.md
```

## 🔧 Configuration

### Backend Services Ports
- API Gateway: `8080`
- Writing Service: `8081`
- User Service: `8082`
- AI Service: `8083`

### Database
- Host: `localhost`
- Port: `5432`
- Database: `english_ai_db`

### Frontend
- Development: `http://localhost:3000`
- Production: To be deployed on Railway

## 📚 API Documentation

### User Service
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/users/me` - Get current user profile

### Writing Service
- `POST /api/sessions` - Start new writing session
- `POST /api/sessions/{id}/respond` - Submit response
- `GET /api/sessions/{id}` - Get session details
- `GET /api/mistakes` - Get user mistakes

### AI Service
- `POST /api/ai/generate-question` - Generate AI question
- `POST /api/ai/check-grammar` - Check grammar
- `POST /api/ai/improve-sentence` - Get improvement suggestions

## 🧪 Testing

### Backend Tests
```bash
mvn test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Building for Production

### Backend
```bash
mvn clean package
```

### Frontend
```bash
cd frontend
npm run build
```

## 🚢 Deployment

This project is configured for deployment on **Railway**.

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically build and deploy

## 📈 Development Progress

- [x] Phase 1: Project Setup & Infrastructure ✅
- [ ] Phase 2: Backend - User Service
- [ ] Phase 3: Backend - Writing Service
- [ ] Phase 4: Backend - AI Service
- [ ] Phase 5: API Gateway
- [ ] Phase 6: Frontend - Core Setup
- [ ] Phase 7: Frontend - Features
- [ ] Phase 8: Integration & Testing
- [ ] Phase 9: Deployment

See [progress-tracking.md](docs/progress-tracking.md) for detailed progress.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- OpenAI for the GPT API
- Spring Boot team for the excellent framework
- React team for the amazing library

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

---

Made with ❤️ by Your Name
