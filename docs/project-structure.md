# 📁 Cấu Trúc Dự Án English AI

## Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (ReactJS)                             │
│                         Port: 3000 (Development)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (Spring Cloud)                       │
│                              Port: 8080                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  Writing Service  │   │   User Service    │   │  AI Service       │
│    Port: 8081     │   │    Port: 8082     │   │   Port: 8083      │
└───────────────────┘   └───────────────────┘   └───────────────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database                               │
│                              Port: 5432                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Frontend (ReactJS)

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── assets/                     # Static assets (images, fonts)
│   │   ├── images/
│   │   └── styles/
│   │       ├── global.css
│   │       └── variables.css
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx
│   │   │   │   └── Button.css
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   └── Loading/
│   │   │
│   │   └── writing/                # Writing feature components
│   │       ├── TopicInput/
│   │       │   ├── TopicInput.jsx
│   │       │   └── TopicInput.css
│   │       ├── ChatMessage/
│   │       │   ├── ChatMessage.jsx
│   │       │   └── ChatMessage.css
│   │       ├── WritingArea/
│   │       │   ├── WritingArea.jsx
│   │       │   └── WritingArea.css
│   │       ├── FeedbackPanel/
│   │       │   ├── FeedbackPanel.jsx
│   │       │   └── FeedbackPanel.css
│   │       ├── ImproveSuggestion/
│   │       │   ├── ImproveSuggestion.jsx
│   │       │   └── ImproveSuggestion.css
│   │       └── MistakeHistory/
│   │           ├── MistakeHistory.jsx
│   │           └── MistakeHistory.css
│   │
│   ├── pages/                      # Page components
│   │   ├── HomePage/
│   │   │   ├── HomePage.jsx
│   │   │   └── HomePage.css
│   │   ├── WritingPracticePage/
│   │   │   ├── WritingPracticePage.jsx
│   │   │   └── WritingPracticePage.css
│   │   └── MistakeReviewPage/
│   │       ├── MistakeReviewPage.jsx
│   │       └── MistakeReviewPage.css
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useWritingSession.js
│   │   ├── useAIFeedback.js
│   │   └── useMistakeHistory.js
│   │
│   ├── services/                   # API service calls
│   │   ├── api.js                  # Axios instance configuration
│   │   ├── writingService.js
│   │   ├── userService.js
│   │   └── aiService.js
│   │
│   ├── store/                      # State management (Redux/Zustand)
│   │   ├── index.js
│   │   ├── writingSlice.js
│   │   └── userSlice.js
│   │
│   ├── utils/                      # Utility functions
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── validators.js
│   │
│   ├── App.jsx
│   ├── App.css
│   └── index.js
│
├── package.json
├── .env
├── .env.example
└── README.md
```

---

## 2. Backend Microservices (Java Spring Boot)

### 2.1. API Gateway

```
api-gateway/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/englishai/gateway/
│       │       ├── ApiGatewayApplication.java
│       │       ├── config/
│       │       │   ├── GatewayConfig.java
│       │       │   ├── CorsConfig.java
│       │       │   └── SecurityConfig.java
│       │       └── filter/
│       │           └── AuthenticationFilter.java
│       └── resources/
│           └── application.yml
├── pom.xml
└── Dockerfile
```

### 2.2. Writing Service

```
writing-service/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/englishai/writing/
│       │       ├── WritingServiceApplication.java
│       │       │
│       │       ├── controller/
│       │       │   ├── SessionController.java
│       │       │   ├── ConversationController.java
│       │       │   └── MistakeController.java
│       │       │
│       │       ├── service/
│       │       │   ├── SessionService.java
│       │       │   ├── ConversationService.java
│       │       │   └── MistakeService.java
│       │       │
│       │       ├── repository/
│       │       │   ├── SessionRepository.java
│       │       │   ├── ConversationRepository.java
│       │       │   └── MistakeRepository.java
│       │       │
│       │       ├── entity/
│       │       │   ├── WritingSession.java
│       │       │   ├── Conversation.java
│       │       │   └── UserMistake.java
│       │       │
│       │       ├── dto/
│       │       │   ├── request/
│       │       │   │   ├── StartSessionRequest.java
│       │       │   │   └── SubmitAnswerRequest.java
│       │       │   └── response/
│       │       │       ├── SessionResponse.java
│       │       │       ├── FeedbackResponse.java
│       │       │       └── MistakeResponse.java
│       │       │
│       │       ├── exception/
│       │       │   ├── GlobalExceptionHandler.java
│       │       │   └── CustomExceptions.java
│       │       │
│       │       └── config/
│       │           └── AppConfig.java
│       │
│       └── resources/
│           ├── application.yml
│           └── db/migration/        # Flyway migrations
│               ├── V1__create_sessions_table.sql
│               ├── V2__create_conversations_table.sql
│               └── V3__create_mistakes_table.sql
│
├── pom.xml
└── Dockerfile
```

### 2.3. User Service

```
user-service/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/englishai/user/
│       │       ├── UserServiceApplication.java
│       │       ├── controller/
│       │       │   ├── AuthController.java
│       │       │   └── UserController.java
│       │       ├── service/
│       │       │   ├── AuthService.java
│       │       │   └── UserService.java
│       │       ├── repository/
│       │       │   └── UserRepository.java
│       │       ├── entity/
│       │       │   └── User.java
│       │       ├── dto/
│       │       │   ├── LoginRequest.java
│       │       │   ├── RegisterRequest.java
│       │       │   └── UserResponse.java
│       │       ├── security/
│       │       │   ├── JwtTokenProvider.java
│       │       │   └── JwtAuthenticationFilter.java
│       │       └── config/
│       │           └── SecurityConfig.java
│       └── resources/
│           ├── application.yml
│           └── db/migration/
│               └── V1__create_users_table.sql
├── pom.xml
└── Dockerfile
```

### 2.4. AI Service

```
ai-service/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/englishai/ai/
│       │       ├── AIServiceApplication.java
│       │       │
│       │       ├── controller/
│       │       │   └── AIController.java
│       │       │
│       │       ├── service/
│       │       │   ├── AIService.java
│       │       │   ├── GrammarCheckService.java
│       │       │   ├── ConversationGeneratorService.java
│       │       │   └── ImprovementSuggestionService.java
│       │       │
│       │       ├── client/
│       │       │   └── OpenAIClient.java     # Hoặc client cho AI model khác
│       │       │
│       │       ├── dto/
│       │       │   ├── request/
│       │       │   │   ├── GenerateQuestionRequest.java
│       │       │   │   ├── CheckGrammarRequest.java
│       │       │   │   └── ImproveSentenceRequest.java
│       │       │   └── response/
│       │       │       ├── QuestionResponse.java
│       │       │       ├── GrammarFeedbackResponse.java
│       │       │       └── ImprovementResponse.java
│       │       │
│       │       ├── prompt/
│       │       │   └── PromptTemplates.java  # Các prompt template cho AI
│       │       │
│       │       └── config/
│       │           └── AIConfig.java
│       │
│       └── resources/
│           └── application.yml
│
├── pom.xml
└── Dockerfile
```

---

## 3. Database Schema (PostgreSQL)

```
database/
├── init/
│   └── init.sql                    # Initial database setup
├── migrations/
│   ├── V1__create_users.sql
│   ├── V2__create_writing_sessions.sql
│   ├── V3__create_conversations.sql
│   └── V4__create_user_mistakes.sql
└── docker-compose.yml
```

---

## 4. Infrastructure & DevOps

```
infrastructure/
├── docker/
│   ├── docker-compose.yml          # Development environment
│   ├── docker-compose.prod.yml     # Production environment
│   └── .env.example
│
├── railway/                        # Railway deployment configs
│   ├── railway.json
│   └── Procfile
│
├── nginx/
│   └── nginx.conf                  # Reverse proxy configuration
│
└── scripts/
    ├── build.sh
    ├── deploy.sh
    └── seed-data.sh
```

---

## 5. Shared Libraries

```
shared/
├── common-dto/
│   ├── src/main/java/com/englishai/common/
│   │   ├── dto/
│   │   │   └── ApiResponse.java
│   │   └── exception/
│   │       └── BaseException.java
│   └── pom.xml
│
└── common-utils/
    ├── src/main/java/com/englishai/utils/
    │   ├── DateUtils.java
    │   └── StringUtils.java
    └── pom.xml
```

---

## 6. Root Project Structure

```
english-ai/
├── frontend/                       # ReactJS Frontend
├── api-gateway/                    # Spring Cloud Gateway
├── writing-service/                # Writing Feature Service
├── user-service/                   # Authentication & User Management
├── ai-service/                     # AI Integration Service
├── shared/                         # Shared Libraries
├── infrastructure/                 # DevOps & Deployment
├── docs/                           # Documentation
│   ├── ba.txt                      # Business Analysis
│   ├── project-structure.md        # This file
│   ├── implementation-guide.md     # Implementation Guide
│   ├── progress-tracking.md        # Progress Tracking
│   ├── api-specification.md        # API Documentation
│   └── database-design.md          # Database Design
├── .gitignore
├── pom.xml                         # Parent POM (Maven)
└── README.md
```

---

## Ghi Chú Quan Trọng

> [!IMPORTANT]
> **Tech Stack:**
> - **Frontend**: ReactJS
> - **Backend**: Java Spring Boot (Microservices)
> - **Database**: PostgreSQL
> - **Deployment**: Railway
> - **Architecture**: Microservices + Data Mesh

> [!NOTE]
> **Ports mặc định:**
> - Frontend: 3000
> - API Gateway: 8080
> - Writing Service: 8081
> - User Service: 8082
> - AI Service: 8083
> - PostgreSQL: 5432
