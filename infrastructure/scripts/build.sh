#!/bin/bash

# Build script for English AI project

echo "🚀 Building English AI Project..."

# Build Backend Services
echo "📦 Building Backend Services..."

# Build User Service
echo "Building User Service..."
cd backend/user-service
mvn clean package -DskipTests
cd ../..

# Build Writing Service
echo "Building Writing Service..."
cd backend/writing-service
mvn clean package -DskipTests
cd ../..

# Build AI Service
echo "Building AI Service..."
cd backend/ai-service
mvn clean package -DskipTests
cd ../..

# Build API Gateway
echo "Building API Gateway..."
cd backend/api-gateway
mvn clean package -DskipTests
cd ../..

# Build Frontend
echo "📦 Building Frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Build completed successfully!"
