# Build script for English AI project (Windows PowerShell)

Write-Host "🚀 Building English AI Project..." -ForegroundColor Green

# Build Backend Services
Write-Host "📦 Building Backend Services..." -ForegroundColor Cyan

# Build User Service
Write-Host "Building User Service..." -ForegroundColor Yellow
Set-Location backend\user-service
mvn clean package -DskipTests
Set-Location ..\..

# Build Writing Service
Write-Host "Building Writing Service..." -ForegroundColor Yellow
Set-Location backend\writing-service
mvn clean package -DskipTests
Set-Location ..\..

# Build AI Service
Write-Host "Building AI Service..." -ForegroundColor Yellow
Set-Location backend\ai-service
mvn clean package -DskipTests
Set-Location ..\..

# Build API Gateway
Write-Host "Building API Gateway..." -ForegroundColor Yellow
Set-Location backend\api-gateway
mvn clean package -DskipTests
Set-Location ..\..

# Build Frontend
Write-Host "📦 Building Frontend..." -ForegroundColor Cyan
Set-Location frontend
npm install
npm run build
Set-Location ..

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
