#!/usr/bin/env python3
"""
Comprehensive Integration Tests for Project Enigma

Tests the complete end-to-end functionality including:
- API endpoint integration
- Workflow execution with real/mock APIs
- Repository management
- Chat interface with streaming
- Error handling and recovery
- Performance and security
"""

import asyncio
import json
import pytest
import time
from datetime import datetime
from typing import Dict, List
import aiohttp
import websockets
from unittest.mock import patch, MagicMock

from backend.app.core.config import get_settings
from backend.app.models.api import ChatRequest, RepositoryConfig
from backend.test_workflow_engine import WorkflowEngineTest

class IntegrationTestSuite:
    """Comprehensive integration test suite."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        self.test_repositories = []
        self.test_sessions = []
        
    async def setup(self):
        """Set up test environment."""
        self.session = aiohttp.ClientSession()
        
        # Wait for API to be ready
        await self._wait_for_api_ready()
        
        # Set up test data
        await self._setup_test_repositories()
        
    async def teardown(self):
        """Clean up test environment."""
        # Clean up test repositories
        for repo in self.test_repositories:
            try:
                await self._delete_repository(repo['id'])
            except:
                pass
        
        if self.session:
            await self.session.close()
    
    async def _wait_for_api_ready(self, timeout: int = 30):
        """Wait for API to be ready."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                async with self.session.get(f"{self.base_url}/health") as response:
                    if response.status == 200:
                        return
            except:
                pass
            await asyncio.sleep(1)
        
        raise Exception("API not ready within timeout")
    
    async def _setup_test_repositories(self):
        """Set up test repositories."""
        test_repos = [
            {
                "name": "test-frontend",
                "url": "https://github.com/test-org/test-frontend",
                "type": "frontend",
                "active": True
            },
            {
                "name": "test-backend", 
                "url": "https://github.com/test-org/test-backend",
                "type": "backend",
                "active": True
            },
            {
                "name": "test-service",
                "url": "https://github.com/test-org/test-service", 
                "type": "service",
                "active": True
            }
        ]
        
        for repo_data in test_repos:
            repo = await self._create_repository(repo_data)
            self.test_repositories.append(repo)

class TestHealthEndpoints:
    """Test health check and monitoring endpoints."""
    
    @pytest.mark.asyncio
    async def test_basic_health_check(self, integration_suite):
        """Test basic health check endpoint."""
        async with integration_suite.session.get(f"{integration_suite.base_url}/health") as response:
            assert response.status == 200
            data = await response.json()
            assert data["status"] == "healthy"
            assert "service" in data
    
    @pytest.mark.asyncio
    async def test_detailed_health_check(self, integration_suite):
        """Test detailed health check with API connectivity."""
        async with integration_suite.session.get(f"{integration_suite.base_url}/api/health/detailed") as response:
            assert response.status == 200
            data = await response.json()
            assert "checks" in data
            assert "uptime_seconds" in data
            assert "memory_usage_mb" in data
    
    @pytest.mark.asyncio
    async def test_metrics_endpoint(self, integration_suite):
        """Test Prometheus metrics endpoint."""
        async with integration_suite.session.get(f"{integration_suite.base_url}/api/metrics") as response:
            assert response.status == 200
            content = await response.text()
            assert "http_requests_total" in content
            assert "TYPE" in content

class TestRepositoryManagement:
    """Test repository CRUD operations."""
    
    @pytest.mark.asyncio
    async def test_list_repositories(self, integration_suite):
        """Test listing repositories."""
        async with integration_suite.session.get(f"{integration_suite.base_url}/api/repositories") as response:
            assert response.status == 200
            data = await response.json()
            assert "repositories" in data
            assert len(data["repositories"]) >= 3  # Test repos
    
    @pytest.mark.asyncio
    async def test_create_repository(self, integration_suite):
        """Test creating a new repository."""
        repo_data = {
            "name": "test-new-repo",
            "url": "https://github.com/test-org/test-new-repo",
            "type": "service",
            "active": True
        }
        
        repo = await integration_suite._create_repository(repo_data)
        assert repo["name"] == repo_data["name"]
        assert repo["url"] == repo_data["url"]
        assert "id" in repo
        
        # Clean up
        await integration_suite._delete_repository(repo["id"])
    
    @pytest.mark.asyncio
    async def test_update_repository(self, integration_suite):
        """Test updating repository configuration."""
        # Create a test repository
        repo_data = {
            "name": "test-update-repo",
            "url": "https://github.com/test-org/test-update-repo",
            "type": "service",
            "active": True
        }
        repo = await integration_suite._create_repository(repo_data)
        
        # Update the repository
        update_data = {
            "name": "test-updated-repo",
            "active": False
        }
        
        async with integration_suite.session.put(
            f"{integration_suite.base_url}/api/repositories/{repo['id']}",
            json=update_data
        ) as response:
            assert response.status == 200
            updated_repo = await response.json()
            assert updated_repo["name"] == update_data["name"]
            assert updated_repo["active"] == update_data["active"]
        
        # Clean up
        await integration_suite._delete_repository(repo["id"])
    
    @pytest.mark.asyncio
    async def test_delete_repository(self, integration_suite):
        """Test deleting a repository."""
        # Create a test repository
        repo_data = {
            "name": "test-delete-repo",
            "url": "https://github.com/test-org/test-delete-repo",
            "type": "service",
            "active": True
        }
        repo = await integration_suite._create_repository(repo_data)
        
        # Delete the repository
        async with integration_suite.session.delete(
            f"{integration_suite.base_url}/api/repositories/{repo['id']}"
        ) as response:
            assert response.status == 200
            data = await response.json()
            assert data["repository_id"] == repo["id"]
        
        # Verify deletion
        async with integration_suite.session.get(
            f"{integration_suite.base_url}/api/repositories"
        ) as response:
            data = await response.json()
            repo_ids = [r["id"] for r in data["repositories"]]
            assert repo["id"] not in repo_ids

class TestChatInterface:
    """Test chat interface and streaming functionality."""
    
    @pytest.mark.asyncio
    async def test_chat_request_validation(self, integration_suite):
        """Test chat request validation."""
        # Valid request
        valid_request = {
            "message": "Create release documentation",
            "repositories": ["test-frontend", "test-backend"],
            "release_type": "release",
            "sprint_name": "test-sprint",
            "fix_version": "1.0.0"
        }
        
        async with integration_suite.session.post(
            f"{integration_suite.base_url}/api/chat",
            json=valid_request
        ) as response:
            assert response.status == 200
        
        # Invalid request - missing required fields
        invalid_request = {
            "message": "Create release documentation"
        }
        
        async with integration_suite.session.post(
            f"{integration_suite.base_url}/api/chat",
            json=invalid_request
        ) as response:
            assert response.status == 422
    
    @pytest.mark.asyncio
    async def test_chat_streaming_response(self, integration_suite):
        """Test streaming chat responses."""
        request_data = {
            "message": "Create release documentation",
            "repositories": ["test-frontend"],
            "release_type": "release",
            "sprint_name": "test-sprint",
            "fix_version": "1.0.0",
            "session_id": f"test-session-{int(time.time())}"
        }
        
        async with integration_suite.session.post(
            f"{integration_suite.base_url}/api/chat",
            json=request_data
        ) as response:
            assert response.status == 200
            assert response.headers.get('content-type') == 'text/event-stream'
            
            # Read streaming responses
            messages = []
            async for line in response.content:
                line = line.decode('utf-8').strip()
                if line.startswith('data: '):
                    try:
                        data = json.loads(line[6:])
                        messages.append(data)
                        if data.get('type') == 'complete':
                            break
                    except json.JSONDecodeError:
                        continue
            
            assert len(messages) > 0
            assert any(msg.get('type') == 'status' for msg in messages)
    
    @pytest.mark.asyncio
    async def test_approval_workflow(self, integration_suite):
        """Test human approval workflow."""
        request_data = {
            "message": "Create release with approval",
            "repositories": ["test-frontend"],
            "release_type": "release",
            "sprint_name": "test-sprint",
            "fix_version": "1.0.0",
            "session_id": f"approval-test-{int(time.time())}"
        }
        
        # Start workflow
        async with integration_suite.session.post(
            f"{integration_suite.base_url}/api/chat",
            json=request_data
        ) as response:
            approval_id = None
            async for line in response.content:
                line = line.decode('utf-8').strip()
                if line.startswith('data: '):
                    try:
                        data = json.loads(line[6:])
                        if data.get('type') == 'approval_required':
                            approval_id = data.get('approval_id')
                            break
                    except json.JSONDecodeError:
                        continue
        
        if approval_id:
            # Send approval
            approval_data = {
                "approval_id": approval_id,
                "approved": True,
                "session_id": request_data["session_id"]
            }
            
            async with integration_suite.session.post(
                f"{integration_suite.base_url}/api/chat/approval",
                json=approval_data
            ) as response:
                assert response.status == 200
                data = await response.json()
                assert data["approval_id"] == approval_id
                assert data["status"] == "approved"

class TestWorkflowExecution:
    """Test end-to-end workflow execution."""
    
    @pytest.mark.asyncio
    async def test_mock_workflow_execution(self, integration_suite):
        """Test complete workflow execution with mock APIs."""
        with patch('backend.app.integrations.factory.IntegrationFactory.create_jira_client') as mock_jira, \
             patch('backend.app.integrations.factory.IntegrationFactory.create_github_client') as mock_github, \
             patch('backend.app.integrations.factory.IntegrationFactory.create_confluence_client') as mock_confluence:
            
            # Configure mocks
            mock_jira.return_value.get_tickets_by_fix_version.return_value = [
                {"id": "TEST-123", "summary": "Test ticket 1"},
                {"id": "TEST-124", "summary": "Test ticket 2"}
            ]
            
            mock_github.return_value.find_feature_branches.return_value = {
                "TEST-123": "feature/TEST-123",
                "TEST-124": "feature/TEST-124"
            }
            
            mock_confluence.return_value.create_deployment_page.return_value = "https://confluence.test/page/123"
            
            # Execute workflow
            request_data = {
                "message": "Create release documentation",
                "repositories": ["test-frontend", "test-backend"],
                "release_type": "release",
                "sprint_name": "test-sprint",
                "fix_version": "1.0.0",
                "session_id": f"mock-workflow-{int(time.time())}"
            }
            
            async with integration_suite.session.post(
                f"{integration_suite.base_url}/api/chat",
                json=request_data
            ) as response:
                assert response.status == 200
                
                completion_found = False
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data: '):
                        try:
                            data = json.loads(line[6:])
                            if data.get('type') == 'complete':
                                completion_found = True
                                assert 'confluence_url' in data
                                break
                        except json.JSONDecodeError:
                            continue
                
                assert completion_found
    
    @pytest.mark.asyncio
    async def test_workflow_error_handling(self, integration_suite):
        """Test workflow error handling and recovery."""
        with patch('backend.app.integrations.factory.IntegrationFactory.create_jira_client') as mock_jira:
            # Configure mock to raise error
            mock_jira.return_value.get_tickets_by_fix_version.side_effect = Exception("JIRA API Error")
            
            request_data = {
                "message": "Create release documentation",
                "repositories": ["test-frontend"],
                "release_type": "release", 
                "sprint_name": "test-sprint",
                "fix_version": "1.0.0",
                "session_id": f"error-test-{int(time.time())}"
            }
            
            async with integration_suite.session.post(
                f"{integration_suite.base_url}/api/chat",
                json=request_data
            ) as response:
                assert response.status == 200
                
                error_found = False
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data: '):
                        try:
                            data = json.loads(line[6:])
                            if data.get('type') == 'error':
                                error_found = True
                                assert 'JIRA API Error' in data.get('message', '')
                                break
                        except json.JSONDecodeError:
                            continue
                
                assert error_found

class TestPerformanceAndSecurity:
    """Test performance and security aspects."""
    
    @pytest.mark.asyncio
    async def test_rate_limiting(self, integration_suite):
        """Test API rate limiting."""
        # Make rapid requests to trigger rate limiting
        tasks = []
        for i in range(150):  # Exceed rate limit
            task = integration_suite.session.get(f"{integration_suite.base_url}/health")
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Check that some requests were rate limited
        rate_limited = sum(1 for r in responses if hasattr(r, 'status') and r.status == 429)
        assert rate_limited > 0
    
    @pytest.mark.asyncio
    async def test_input_validation(self, integration_suite):
        """Test input validation and sanitization."""
        # Test malicious input
        malicious_requests = [
            {
                "message": "<script>alert('xss')</script>",
                "repositories": ["test-frontend"],
                "release_type": "release",
                "sprint_name": "test-sprint",
                "fix_version": "1.0.0"
            },
            {
                "message": "'; DROP TABLE repositories; --",
                "repositories": ["test-frontend"],
                "release_type": "release",
                "sprint_name": "test-sprint", 
                "fix_version": "1.0.0"
            },
            {
                "message": "test" * 1000,  # Extremely long message
                "repositories": ["test-frontend"],
                "release_type": "release",
                "sprint_name": "test-sprint",
                "fix_version": "1.0.0"
            }
        ]
        
        for malicious_data in malicious_requests:
            async with integration_suite.session.post(
                f"{integration_suite.base_url}/api/chat",
                json=malicious_data
            ) as response:
                # Should either reject with 400/422 or sanitize input
                assert response.status in [200, 400, 422]
    
    @pytest.mark.asyncio
    async def test_response_time_performance(self, integration_suite):
        """Test API response time performance."""
        endpoints = [
            "/health",
            "/api/repositories",
            "/api/health/detailed"
        ]
        
        for endpoint in endpoints:
            start_time = time.time()
            async with integration_suite.session.get(f"{integration_suite.base_url}{endpoint}") as response:
                response_time = time.time() - start_time
                assert response.status == 200
                assert response_time < 2.0  # Should respond within 2 seconds

class TestErrorHandling:
    """Test comprehensive error handling."""
    
    @pytest.mark.asyncio
    async def test_404_handling(self, integration_suite):
        """Test 404 error handling."""
        async with integration_suite.session.get(f"{integration_suite.base_url}/nonexistent-endpoint") as response:
            assert response.status == 404
    
    @pytest.mark.asyncio
    async def test_500_error_handling(self, integration_suite):
        """Test 500 error handling."""
        # This would require triggering an actual server error
        # In a real scenario, you might patch a service to raise an exception
        pass
    
    @pytest.mark.asyncio
    async def test_timeout_handling(self, integration_suite):
        """Test timeout handling."""
        # Test with very short timeout
        timeout = aiohttp.ClientTimeout(total=0.001)
        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(f"{integration_suite.base_url}/api/health/detailed"):
                    pass
        except asyncio.TimeoutError:
            pass  # Expected
        except aiohttp.ServerTimeoutError:
            pass  # Expected

# Fixtures and test configuration
@pytest.fixture(scope="session")
async def integration_suite():
    """Set up integration test suite."""
    suite = IntegrationTestSuite()
    await suite.setup()
    yield suite
    await suite.teardown()

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Test runner configuration
if __name__ == "__main__":
    pytest.main([
        __file__,
        "-v",
        "--asyncio-mode=auto",
        "--tb=short",
        "--durations=10"
    ])