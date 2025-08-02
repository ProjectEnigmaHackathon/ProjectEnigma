"""
API Routes Configuration

This module defines all API routes for the Project Enigma backend,
including chat endpoints, repository management, and health checks.
"""

from fastapi import APIRouter

from app.api.endpoints import chat, health, repositories, workflow

# Create the main API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(
    repositories.router, prefix="/repositories", tags=["repositories"]
)
api_router.include_router(workflow.router, prefix="/workflow", tags=["workflow"])
