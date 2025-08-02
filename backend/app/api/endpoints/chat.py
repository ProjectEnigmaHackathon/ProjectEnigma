"""
Chat Endpoints

Placeholder chat endpoint file.
This will be implemented in the chat interface task.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def chat_placeholder():
    """Placeholder chat endpoint."""
    return {"message": "Chat endpoints will be implemented in task 005"}