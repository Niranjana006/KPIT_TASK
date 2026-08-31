import pytest
from httpx import AsyncClient
from backend import models

pytestmark = pytest.mark.asyncio

async def test_list_jobs(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    # Just verify the endpoint returns 200 (should be empty initially because seed.py doesn't insert jobs)
    response = await async_client.get("/api/jobs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

async def test_list_jobs_unauthorized(async_client: AsyncClient):
    # Clear the auth cookie to simulate unauthorized user
    async_client.cookies.clear()
    response = await async_client.get("/api/jobs")
    assert response.status_code == 401

async def test_get_job_not_found(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    response = await async_client.get("/api/jobs/invalid-id")
    assert response.status_code == 404
