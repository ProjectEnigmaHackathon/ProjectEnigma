# Project Enigma Development Setup Script for Windows PowerShell
# This script sets up the development environment

param(
    [switch]$Force,
    [switch]$SkipDockerCheck
)

Write-Host "🚀 Project Enigma Development Setup" -ForegroundColor Blue
Write-Host "=================================" -ForegroundColor Blue

# Check if Docker is installed and running
if (-not $SkipDockerCheck) {
    Write-Host "📋 Checking Docker installation..." -ForegroundColor Yellow
    try {
        $dockerVersion = docker --version
        Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
        
        # Check if Docker daemon is running
        docker info > $null 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Docker daemon is not running. Please start Docker Desktop." -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Docker daemon is running" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
        Write-Host "   Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        exit 1
    }
}

# Check if .env file exists
Write-Host "📋 Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env") -or $Force) {
    if (Test-Path ".env.template") {
        Write-Host "📄 Creating .env file from template..." -ForegroundColor Yellow
        Copy-Item ".env.template" ".env"
        Write-Host "✅ .env file created. Please edit it with your actual values." -ForegroundColor Green
        Write-Host "   For development, you can keep ENIGMA_USE_MOCK_APIS=true" -ForegroundColor Yellow
    } else {
        Write-Host "❌ .env.template not found" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
$directories = @("config", "data", "data/chat_history")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created directory: $dir" -ForegroundColor Green
    } else {
        Write-Host "✅ Directory exists: $dir" -ForegroundColor Green
    }
}

# Build and start services
Write-Host "🔨 Building and starting services..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes on first run..." -ForegroundColor Yellow

docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Development environment started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Application URLs:" -ForegroundColor Blue
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   Backend API: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "   API Docs: http://localhost:8000/api/docs" -ForegroundColor Cyan
    Write-Host "   Health Check: http://localhost:8000/health" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔧 Useful commands:" -ForegroundColor Blue
    Write-Host "   View logs: docker-compose logs -f" -ForegroundColor Cyan
    Write-Host "   Stop services: docker-compose down" -ForegroundColor Cyan
    Write-Host "   Restart services: docker-compose restart" -ForegroundColor Cyan
    Write-Host "   Rebuild: docker-compose up --build" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to start development environment" -ForegroundColor Red
    Write-Host "   Check the error messages above and try again" -ForegroundColor Yellow
    exit 1
}