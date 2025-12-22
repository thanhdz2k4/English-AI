# 🚀 Railway Deployment Test Script
# PowerShell version

param(
    [string]$RailwayDomain = "english-ai-production-a5c2.up.railway.app"
)

$ApiUrl = "https://$RailwayDomain"

Write-Host "Starting Railway Deployment Test Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing Railway Service: $ApiUrl" -ForegroundColor Yellow
Write-Host ""

# Helper function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url
    )
    
    Write-Host "[OK] $Name" -ForegroundColor Green
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 10 -UseBasicParsing
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   Response:" -ForegroundColor Gray
        Write-Host "   $($response.Content)" -ForegroundColor Gray
    }
    catch {
        Write-Host "   [FAIL] Failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            Write-Host "   Status Code: $statusCode" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# Test 1: Root endpoint
Test-Endpoint -Name "Test 1: Root Endpoint" -Url "$ApiUrl/"

# Test 2: Health endpoint
Test-Endpoint -Name "Test 2: Health Endpoint" -Url "$ApiUrl/actuator/health"

# Test 3: API Gateway info
Test-Endpoint -Name "Test 3: API Gateway Info" -Url "$ApiUrl/actuator/info"

# Test 4: User Service via Gateway
Test-Endpoint -Name "Test 4: User Service Health (via Gateway)" -Url "$ApiUrl/api/users/health"

# Test 5: Writing Service via Gateway
Test-Endpoint -Name "Test 5: Writing Service Health (via Gateway)" -Url "$ApiUrl/api/sessions/health"

# Test 6: AI Service via Gateway
Test-Endpoint -Name "Test 6: AI Service Health (via Gateway)" -Url "$ApiUrl/api/ai/health"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Railway Deployment Test Complete!" -ForegroundColor Cyan
