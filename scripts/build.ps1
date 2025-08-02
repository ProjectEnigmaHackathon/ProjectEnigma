# Project Enigma Build Script for Production
# This script builds the Docker images for production deployment

param(
    [switch]$Push,
    [string]$Tag = "latest"
)

Write-Host "🔨 Project Enigma Production Build" -ForegroundColor Blue
Write-Host "=================================" -ForegroundColor Blue

# Build backend image
Write-Host "📦 Building backend image..." -ForegroundColor Yellow
docker build -t project-enigma-backend:$Tag ./backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend image built successfully" -ForegroundColor Green

# Build frontend image
Write-Host "📦 Building frontend image..." -ForegroundColor Yellow
docker build -t project-enigma-frontend:$Tag ./frontend --target production
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend image built successfully" -ForegroundColor Green

# Tag images
Write-Host "🏷️  Tagging images..." -ForegroundColor Yellow
docker tag project-enigma-backend:$Tag project-enigma-backend:latest
docker tag project-enigma-frontend:$Tag project-enigma-frontend:latest

Write-Host "🎉 Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🐳 Built images:" -ForegroundColor Blue
docker images | Select-String "project-enigma"

if ($Push) {
    Write-Host ""
    Write-Host "🚀 Pushing images..." -ForegroundColor Yellow
    # Add your registry push commands here
    Write-Host "⚠️  Push functionality not implemented yet" -ForegroundColor Yellow
    Write-Host "   Add your Docker registry push commands to this script" -ForegroundColor Yellow
}