# Project Enigma API Documentation

## Overview

Project Enigma provides a comprehensive REST API for automated release documentation and workflow management. The API is built with FastAPI and includes real-time streaming capabilities, repository management, and integration with JIRA, GitHub, and Confluence.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com`

## Authentication

The API uses environment-based authentication for external integrations. No user authentication is required for the hackathon version.

### Required Environment Variables

```bash
ENIGMA_JIRA_TOKEN=your_jira_token
ENIGMA_GITHUB_TOKEN=your_github_token
ENIGMA_CONFLUENCE_TOKEN=your_confluence_token
```

## API Endpoints

### Health Check

#### GET /health

Returns the health status of the API service.

**Response:**
```json
{
  "status": "healthy",
  "service": "project-enigma-backend",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0"
}
```

**Status Codes:**
- `200`: Service is healthy
- `503`: Service is unhealthy

### Repository Management

#### GET /api/repositories

Retrieve all configured repositories.

**Response:**
```json
{
  "repositories": [
    {
      "id": "repo-1",
      "name": "frontend-app",
      "url": "https://github.com/org/frontend-app",
      "type": "frontend",
      "active": true
    },
    {
      "id": "repo-2", 
      "name": "backend-api",
      "url": "https://github.com/org/backend-api",
      "type": "backend",
      "active": true
    }
  ]
}
```

#### POST /api/repositories

Add a new repository configuration.

**Request Body:**
```json
{
  "name": "new-service",
  "url": "https://github.com/org/new-service",
  "type": "service",
  "active": true
}
```

**Response:**
```json
{
  "id": "repo-3",
  "name": "new-service",
  "url": "https://github.com/org/new-service",
  "type": "service",
  "active": true,
  "created_at": "2024-01-01T12:00:00Z"
}
```

**Status Codes:**
- `201`: Repository created successfully
- `400`: Invalid request data
- `409`: Repository already exists

#### PUT /api/repositories/{repository_id}

Update an existing repository configuration.

**Path Parameters:**
- `repository_id` (string): The repository ID

**Request Body:**
```json
{
  "name": "updated-service-name",
  "url": "https://github.com/org/updated-service",
  "type": "service",
  "active": false
}
```

**Response:**
```json
{
  "id": "repo-3",
  "name": "updated-service-name",
  "url": "https://github.com/org/updated-service",
  "type": "service",
  "active": false,
  "updated_at": "2024-01-01T12:30:00Z"
}
```

#### DELETE /api/repositories/{repository_id}

Remove a repository configuration.

**Path Parameters:**
- `repository_id` (string): The repository ID

**Response:**
```json
{
  "message": "Repository deleted successfully",
  "repository_id": "repo-3"
}
```

**Status Codes:**
- `200`: Repository deleted successfully
- `404`: Repository not found

### Chat Interface

#### POST /api/chat

Start a new chat session with streaming workflow execution.

**Request Body:**
```json
{
  "message": "Create release documentation for sprint-2024-01",
  "repositories": ["frontend-app", "backend-api"],
  "release_type": "release",
  "sprint_name": "sprint-2024-01",
  "fix_version": "2024.01.0",
  "session_id": "session-123"
}
```

**Response (Server-Sent Events):**
```
data: {"type": "status", "message": "Starting workflow execution"}

data: {"type": "progress", "step": "jira_collection", "message": "Collecting JIRA tickets for fix version 2024.01.0"}

data: {"type": "data", "step": "jira_collection", "data": {"tickets": [{"id": "PROJ-123", "summary": "Implement new feature"}]}}

data: {"type": "progress", "step": "branch_discovery", "message": "Discovering feature branches"}

data: {"type": "approval_required", "message": "Ready to merge sprint branches to develop. Continue?", "approval_id": "approval-456"}

data: {"type": "complete", "message": "Workflow completed successfully", "confluence_url": "https://confluence.com/pages/123"}
```

**Status Codes:**
- `200`: Chat session started successfully
- `400`: Invalid request data
- `422`: Validation error

#### POST /api/chat/approval

Respond to workflow approval requests.

**Request Body:**
```json
{
  "approval_id": "approval-456",
  "approved": true,
  "session_id": "session-123"
}
```

**Response:**
```json
{
  "message": "Approval processed successfully",
  "approval_id": "approval-456",
  "status": "approved"
}
```

#### GET /api/chat/history/{session_id}

Retrieve chat history for a specific session.

**Path Parameters:**
- `session_id` (string): The session ID

**Response:**
```json
{
  "session_id": "session-123",
  "messages": [
    {
      "timestamp": "2024-01-01T12:00:00Z",
      "type": "user",
      "content": "Create release documentation for sprint-2024-01"
    },
    {
      "timestamp": "2024-01-01T12:00:30Z",
      "type": "assistant",
      "content": "Starting workflow execution..."
    }
  ]
}
```

### Workflow Management

#### GET /api/workflow/status/{session_id}

Get the current status of a workflow execution.

**Path Parameters:**
- `session_id` (string): The session ID

**Response:**
```json
{
  "session_id": "session-123",
  "status": "running",
  "current_step": "branch_discovery",
  "progress": 45,
  "started_at": "2024-01-01T12:00:00Z",
  "estimated_completion": "2024-01-01T12:15:00Z"
}
```

#### POST /api/workflow/cancel/{session_id}

Cancel a running workflow.

**Path Parameters:**
- `session_id` (string): The session ID

**Response:**
```json
{
  "message": "Workflow cancelled successfully",
  "session_id": "session-123",
  "cancelled_at": "2024-01-01T12:05:00Z"
}
```

### Monitoring and Metrics

#### GET /api/metrics

Get application metrics in Prometheus format.

**Response:**
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/api/repositories"} 42
http_requests_total{method="POST",endpoint="/api/chat"} 15

# HELP workflow_executions_total Total number of workflow executions
# TYPE workflow_executions_total counter
workflow_executions_total{status="completed"} 8
workflow_executions_total{status="failed"} 2
```

#### GET /api/health/detailed

Get detailed health information including API connectivity.

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "status": "healthy",
      "response_time_ms": 5
    },
    "jira_api": {
      "status": "healthy",
      "response_time_ms": 150
    },
    "github_api": {
      "status": "healthy",
      "response_time_ms": 200
    },
    "confluence_api": {
      "status": "degraded",
      "response_time_ms": 5000,
      "message": "High response time"
    }
  },
  "uptime_seconds": 86400,
  "memory_usage_mb": 512,
  "cpu_usage_percent": 25
}
```

## Error Responses

### Standard Error Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid repository configuration",
    "details": {
      "field": "url",
      "reason": "Invalid URL format"
    },
    "timestamp": "2024-01-01T12:00:00Z",
    "request_id": "req-123"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTHENTICATION_ERROR` | 401 | Authentication required |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### API Integration Errors

| Code | Description |
|------|-------------|
| `JIRA_CONNECTION_ERROR` | Cannot connect to JIRA API |
| `GITHUB_CONNECTION_ERROR` | Cannot connect to GitHub API |
| `CONFLUENCE_CONNECTION_ERROR` | Cannot connect to Confluence API |
| `WORKFLOW_EXECUTION_ERROR` | Workflow execution failed |
| `BRANCH_NOT_FOUND` | Required branch not found |
| `MERGE_CONFLICT` | Merge conflict detected |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default**: 100 requests per 60 seconds per IP
- **Chat endpoints**: 10 requests per 60 seconds per session
- **Repository management**: 20 requests per 60 seconds per IP

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket Support

For real-time updates, the API supports WebSocket connections:

### Connection

```javascript
const ws = new WebSocket('ws://localhost:8000/api/ws');
```

### Message Format

```json
{
  "type": "workflow_update",
  "session_id": "session-123",
  "data": {
    "step": "branch_discovery",
    "progress": 50,
    "message": "Discovered 5 feature branches"
  }
}
```

## SDK Examples

### Python SDK

```python
import requests

class EnigmaClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
    
    def start_release_workflow(self, repositories, sprint_name, fix_version):
        response = requests.post(
            f"{self.base_url}/api/chat",
            json={
                "message": f"Create release for {sprint_name}",
                "repositories": repositories,
                "release_type": "release",
                "sprint_name": sprint_name,
                "fix_version": fix_version
            },
            stream=True
        )
        return response
    
    def get_repositories(self):
        response = requests.get(f"{self.base_url}/api/repositories")
        return response.json()

# Usage
client = EnigmaClient()
repos = client.get_repositories()
workflow = client.start_release_workflow(
    repositories=["frontend", "backend"],
    sprint_name="sprint-2024-01", 
    fix_version="2024.01.0"
)
```

### JavaScript SDK

```javascript
class EnigmaClient {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }
    
    async startReleaseWorkflow(repositories, sprintName, fixVersion) {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Create release for ${sprintName}`,
                repositories,
                release_type: 'release',
                sprint_name: sprintName,
                fix_version: fixVersion
            })
        });
        return response;
    }
    
    async getRepositories() {
        const response = await fetch(`${this.baseUrl}/api/repositories`);
        return response.json();
    }
}

// Usage
const client = new EnigmaClient();
const repos = await client.getRepositories();
const workflow = await client.startReleaseWorkflow(
    ['frontend', 'backend'],
    'sprint-2024-01',
    '2024.01.0'
);
```

## Testing

### Health Check Test

```bash
curl -X GET http://localhost:8000/health
```

### Repository Creation Test

```bash
curl -X POST http://localhost:8000/api/repositories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-repo",
    "url": "https://github.com/org/test-repo",
    "type": "service",
    "active": true
  }'
```

### Workflow Execution Test

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create release documentation",
    "repositories": ["test-repo"],
    "release_type": "release",
    "sprint_name": "test-sprint",
    "fix_version": "1.0.0"
  }'
```

## Troubleshooting

### Common Issues

1. **API Connection Errors**: Verify environment variables are set correctly
2. **Rate Limiting**: Implement exponential backoff in client code
3. **Workflow Failures**: Check logs for specific integration errors
4. **Streaming Issues**: Ensure proper Server-Sent Events handling

### Debug Mode

Enable debug mode for detailed logging:

```bash
ENIGMA_DEBUG=true ENIGMA_LOG_LEVEL=DEBUG python main.py
```

### Log Analysis

Check application logs for detailed error information:

```bash
docker logs enigma-backend-prod
```

## Changelog

### Version 1.0.0
- Initial API release
- Repository management endpoints
- Chat interface with streaming
- Workflow execution and monitoring
- Health checks and metrics

---

*For more information, visit the [Project Enigma GitHub repository](https://github.com/org/project-enigma)*