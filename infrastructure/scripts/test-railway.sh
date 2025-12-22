#!/bin/bash

echo "🚀 Starting Railway Deployment Test Script"
echo "=========================================="

# Get the Railway public domain
RAILWAY_DOMAIN=${1:-"english-ai-production-a5c2.up.railway.app"}
API_URL="https://$RAILWAY_DOMAIN"

echo ""
echo "📍 Testing Railway Service: $API_URL"
echo ""

# Test 1: Root endpoint
echo "✅ Test 1: Root Endpoint"
curl -s -w "\n⏱ Response Time: %{time_total}s | Status: %{http_code}\n" \
  "$API_URL/" || echo "❌ Failed"
echo ""

# Test 2: Health endpoint
echo "✅ Test 2: Health Endpoint"
curl -s -w "\n⏱ Response Time: %{time_total}s | Status: %{http_code}\n" \
  "$API_URL/actuator/health" || echo "❌ Failed"
echo ""

# Test 3: API Gateway routes
echo "✅ Test 3: API Gateway Info"
curl -s -w "\n⏱ Response Time: %{time_total}s | Status: %{http_code}\n" \
  "$API_URL/actuator/info" || echo "❌ Failed"
echo ""

# Test 4: User Service via Gateway
echo "✅ Test 4: User Service Health (via Gateway)"
curl -s -w "\n⏱ Response Time: %{time_total}s | Status: %{http_code}\n" \
  "$API_URL/api/users/health" || echo "❌ Failed"
echo ""

# Test 5: Writing Service via Gateway
echo "✅ Test 5: Writing Service Health (via Gateway)"
curl -s -w "\n⏱ Response Time: %{time_total}s | Status: %{http_code}\n" \
  "$API_URL/api/sessions/health" || echo "❌ Failed"
echo ""

# Test 6: AI Service via Gateway
echo "✅ Test 6: AI Service Health (via Gateway)"
curl -s -w "\n⏱ Response Time: %{time_total}s | Status: %{http_code}\n" \
  "$API_URL/api/ai/health" || echo "❌ Failed"
echo ""

echo "=========================================="
echo "🎉 Railway Deployment Test Complete!"
