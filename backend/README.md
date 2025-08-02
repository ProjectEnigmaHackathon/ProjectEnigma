# Project Enigma - Backend

FastAPI backend service for the AI-powered release documentation automation tool.

## 🚀 Quick Start

### Prerequisites

- Python 3.11 or higher
- Git

### Local Development Setup

1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Activate the virtual environment** [[memory:4971108]]
   ```bash
   # Windows
   .\venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create environment configuration**
   ```bash
   # Create .env file in the project root (one level up from backend/)
   cp ../.env.template ../.env
   # Edit the .env file with your configuration
   ```

5. **Start the development server**
   ```bash
   python main.py
   ```

The backend will be available at:
- **API Server**: http://localhost:8000
- **Interactive API Documentation**: http://localhost:8000/api/docs
- **Alternative API Documentation**: http://localhost:8000/redoc

## 🏗️ Architecture

The backend is built with:
- **FastAPI**: Modern, fast web framework for building APIs
- **LangGraph**: AI workflow orchestration
- **Pydantic**: Data validation and serialization
- **Uvicorn**: ASGI server for production

### Project Structure

```
backend/
├── app/
│   ├── api/               # API routes and endpoints
│   │   ├── endpoints/     # Individual endpoint modules
│   │   └── routes.py      # Route registration
│   ├── core/              # Core configuration and utilities
│   │   ├── config.py      # Application configuration
│   │   ├── logging.py     # Logging configuration
│   │   └── middleware.py  # Custom middleware
│   ├── integrations/      # External API integrations
│   │   ├── real/          # Production API implementations
│   │   ├── mock/          # Mock implementations for development
│   │   └── base/          # Abstract base interfaces
│   ├── models/            # Pydantic data models
│   ├── services/          # Business logic services
│   ├── workflows/         # LangGraph workflow definitions
│   └── utils/             # Utility functions
├── tests/                 # Test files
├── main.py               # Application entry point
├── requirements.txt      # Python dependencies
└── Dockerfile           # Docker configuration
```

## 🛠️ Development

### Environment Variables

Configure the following in your `.env` file (in the project root):

```bash
# Development setup (recommended for getting started)
ENIGMA_ENVIRONMENT=development
ENIGMA_USE_MOCK_APIS=true

# Server configuration
ENIGMA_HOST=0.0.0.0
ENIGMA_PORT=8000
ENIGMA_DEBUG=true

# For production (requires real API credentials)
ENIGMA_ENVIRONMENT=production
ENIGMA_USE_MOCK_APIS=false
ENIGMA_JIRA_BASE_URL=https://your-company.atlassian.net
ENIGMA_JIRA_TOKEN=your-api-token
ENIGMA_GITHUB_TOKEN=your-github-token
ENIGMA_CONFLUENCE_BASE_URL=https://your-company.atlassian.net/wiki
ENIGMA_SECRET_KEY=your-secret-key-here
```

### Available Scripts

```bash
# Start development server
python main.py

# Run tests
pytest tests/ -v

# Run tests with coverage
pytest tests/ --cov=app

# Code formatting
black app/
isort app/

# Linting
flake8 app/
mypy app/
```

### API Development

The backend provides several key endpoints:

- `GET /health` - Health check endpoint
- `POST /api/chat` - Chat with AI workflow
- `GET /api/chat/history` - Get chat history
- `GET /api/repositories` - List configured repositories
- `POST /api/repositories` - Add a new repository

### Using Mock APIs

For development, the backend can use mock implementations of external APIs (JIRA, GitHub, Confluence). Set `ENIGMA_USE_MOCK_APIS=true` in your environment to enable this mode.

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_specific_file.py

# Run tests matching a pattern
pytest -k "test_pattern"
```

### Test Structure

- `tests/` - Main test directory
- Tests use pytest framework
- Mock external dependencies for unit tests
- Integration tests use real API implementations

## 📊 Monitoring and Logging

The backend uses structured logging with JSON output for easy parsing and monitoring.

```python
import structlog

logger = structlog.get_logger(__name__)
logger.info("Application started", port=8000, environment="development")
```

## 🔧 Troubleshooting

### Common Issues

**Virtual environment not found:**
```bash
# Create a new virtual environment
python -m venv venv

# Activate it
# Windows
.\venv\Scripts\activate
# macOS/Linux  
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Port already in use:**
```bash
# Check what's using port 8000
netstat -an | findstr "8000"  # Windows
lsof -i :8000                 # macOS/Linux

# Change port in .env file
ENIGMA_PORT=8001
```

**Import errors:**
```bash
# Make sure you're in the backend directory
cd backend

# Ensure virtual environment is activated
# Check with:
which python  # Should point to venv/bin/python

# Reinstall dependencies
pip install -r requirements.txt
```

**API connection issues:**
```bash
# Check if server is running
curl http://localhost:8000/health

# Check logs for errors
python main.py  # Run in foreground to see logs
```

### Debug Mode

Enable detailed logging by setting:
```bash
ENIGMA_DEBUG=true
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t project-enigma-backend .

# Run container
docker run -p 8000:8000 --env-file ../.env project-enigma-backend
```

### Production Considerations

1. Set `ENIGMA_ENVIRONMENT=production`
2. Use `ENIGMA_USE_MOCK_APIS=false`
3. Configure real API credentials
4. Set a strong `ENIGMA_SECRET_KEY`
5. Configure proper CORS origins
6. Set up SSL/TLS termination
7. Use a production ASGI server (Uvicorn with Gunicorn)

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/redoc

These provide interactive documentation where you can test API endpoints directly.

## 🤝 Contributing

1. Make sure all tests pass: `pytest`
2. Format code: `black app/ && isort app/`
3. Check linting: `flake8 app/ && mypy app/`
4. Update tests for new functionality
5. Update API documentation if needed

---

For more information, see the main [project README](../README.md).