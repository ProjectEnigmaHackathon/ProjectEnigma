# Project Enigma 🔮

AI-powered release documentation automation tool that streamlines deployment documentation creation by integrating JIRA tickets, GitHub branches, and Confluence documentation.

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- [Git](https://git-scm.com/) for version control
- Windows PowerShell (for Windows users)

### 1-Minute Setup

```powershell
# Clone the repository
git clone https://github.com/your-org/project-enigma.git
cd project-enigma

# Run the setup script
.\scripts\dev-setup.ps1

# Open your browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api/docs
```

That's it! 🎉 The application should now be running locally.

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Features](#-features)
- [Development Setup](#-development-setup)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## 🏗️ Architecture Overview

Project Enigma consists of two main components:

```
┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FastAPI Backend │
│   (TypeScript)   │◄──►│   (Python)      │
│   Port: 3000     │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘
                               │
                       ┌───────▼────────┐
                       │   LangGraph    │
                       │   Workflows    │
                       └────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
      ┌─────▼─────┐    ┌───────▼───────┐  ┌──────▼──────┐
      │   JIRA    │    │    GitHub     │  │ Confluence  │
      │    API    │    │     API       │  │     API     │
      └───────────┘    └───────────────┘  └─────────────┘
```

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS for styling
- Vite for build tooling
- React Router for navigation

**Backend:**
- FastAPI + Python 3.12+
- LangGraph for AI workflows
- Pydantic for data validation
- Structured logging with JSON

**Infrastructure:**
- Docker + Docker Compose
- Nginx for production serving
- Volume-based data persistence

## ✨ Features

### Core Functionality
- **Chat-First Interface**: Intuitive conversational AI for release management
- **Repository Management**: Multi-repository release coordination
- **JIRA Integration**: Automatic ticket collection by fix version
- **GitHub Automation**: Branch discovery, merging, and PR creation
- **Confluence Documentation**: Automated deployment document generation

### Developer Experience
- **Hot Reloading**: Real-time development feedback
- **Mock APIs**: Development without external dependencies
- **Type Safety**: Full TypeScript and Python type checking
- **Structured Logging**: Comprehensive debugging information

## 🛠️ Development Setup

### Manual Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/project-enigma.git
   cd project-enigma
   ```

2. **Create environment file**
   ```bash
   cp .env.template .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/docs

### Alternative: Local Development

For faster development cycles, you can run services locally:

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## ⚙️ Configuration

### Environment Variables

Copy `.env.template` to `.env` and configure:

```bash
# Development setup (recommended for getting started)
ENIGMA_ENVIRONMENT=development
ENIGMA_USE_MOCK_APIS=true

# Production setup (requires real API credentials)
ENIGMA_ENVIRONMENT=production
ENIGMA_USE_MOCK_APIS=false
ENIGMA_JIRA_BASE_URL=https://your-company.atlassian.net
ENIGMA_JIRA_TOKEN=your-api-token
ENIGMA_GITHUB_TOKEN=your-github-token
ENIGMA_CONFLUENCE_BASE_URL=https://your-company.atlassian.net/wiki
```

### Repository Configuration

Edit `config/repositories.json` to add your repositories:

```json
{
  "repositories": [
    {
      "id": "1",
      "name": "frontend",
      "url": "https://github.com/your-org/frontend",
      "description": "React frontend application"
    },
    {
      "id": "2", 
      "name": "backend",
      "url": "https://github.com/your-org/backend",
      "description": "FastAPI backend service"
    }
  ]
}
```

## 📖 Usage

### Basic Workflow

1. **Select Repositories**: Choose target repositories from the dropdown
2. **Initiate Release**: Send a message like:
   ```
   Create release for repos: frontend, backend
   Fix version: v2.1.0
   Sprint: Sprint-2024-01
   Release type: release
   ```
3. **Monitor Progress**: Watch real-time updates as the AI processes each step
4. **Approve Actions**: Confirm merging operations when prompted
5. **Get Documentation**: Receive Confluence documentation link when complete

### Chat Interface Commands

- **Release Creation**: `"Create release for [repos] with fix version [version]"`
- **Status Check**: `"What's the status of release v2.1.0?"`
- **Repository Info**: `"Show me branches for frontend repo"`

## 📚 API Documentation

### Interactive Documentation

Visit http://localhost:8000/api/docs for interactive API documentation with:
- Request/response schemas
- Try-it-out functionality
- Authentication examples

### Key Endpoints

```
GET  /health              - Health check
POST /api/chat            - Chat with AI workflow
GET  /api/chat/history    - Get chat history
GET  /api/repositories    - List repositories
POST /api/repositories    - Add repository
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
pytest tests/ --cov=app  # With coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### Integration Tests
```bash
# Run full stack integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 🚀 Deployment

### Production Build

```bash
# Build production images
.\scripts\build.ps1

# Deploy with production compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Setup

For production deployment:

1. Set `ENIGMA_USE_MOCK_APIS=false`
2. Configure real API credentials
3. Set strong `ENIGMA_SECRET_KEY`
4. Configure proper CORS origins
5. Set up persistent volumes
6. Configure HTTPS termination

## 🔧 Troubleshooting

### Common Issues

**Docker not starting:**
```bash
# Check Docker daemon
docker info

# Reset Docker if needed
docker system prune -a
```

**Port conflicts:**
```bash
# Check what's using the ports
netstat -an | findstr "3000"
netstat -an | findstr "8000"

# Change ports in docker-compose.yml if needed
```

**API connection issues:**
```bash
# Check backend health
curl http://localhost:8000/health

# Check logs
docker-compose logs backend
```

**Frontend build issues:**
```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode

Enable detailed logging:
```bash
# Set in .env
ENIGMA_DEBUG=true

# View logs
docker-compose logs -f backend
```

## 🔄 Development Workflow

### Making Changes

1. **Backend changes**: Code hot-reloads automatically
2. **Frontend changes**: Vite provides instant updates
3. **Configuration changes**: Restart containers
4. **Dependencies**: Rebuild images

### Code Quality

```bash
# Backend formatting and linting
cd backend
black app/
isort app/
flake8 app/
mypy app/

# Frontend formatting and linting
cd frontend
npm run lint
npm run format
npm run type-check
```

## 📁 Project Structure

```
project-enigma/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Configuration & utilities
│   │   ├── models/         # Data models
│   │   ├── services/       # External service integrations
│   │   ├── workflows/      # LangGraph workflows
│   │   └── utils/          # Helper functions
│   ├── tests/              # Backend tests
│   ├── Dockerfile          # Backend container
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   ├── Dockerfile          # Frontend container
│   └── package.json        # Node dependencies
├── config/                 # Configuration files
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
├── .env.template           # Environment template
└── README.md              # This file
```

## 🤝 Contributing

### Development Guidelines

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper tests
4. **Run quality checks**: `npm run lint && npm test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Standards

- Follow TypeScript/Python type hints
- Write tests for new functionality
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/project-enigma/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/project-enigma/discussions)
- **Documentation**: [Wiki](https://github.com/your-org/project-enigma/wiki)

---

**Built with ❤️ for the hackathon by the Project Enigma Team**