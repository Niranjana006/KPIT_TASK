import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_global_activity(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    res = await async_client.get("/api/activity")
    assert res.status_code == 200
    activities = res.json()
    assert isinstance(activities, list)

@pytest.mark.asyncio
async def test_list_project_activity(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    # We know p1 is seeded and Priya is a member
    res = await async_client.get("/api/projects/p1/activity")
    assert res.status_code == 200
    activities = res.json()
    assert isinstance(activities, list)

@pytest.mark.asyncio
async def test_list_project_activity_unauthorized(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "meera@flowforge.dev",
        "password": "password"
    })
    
    # Meera is not a member of p1
    res = await async_client.get("/api/projects/p1/activity")
    assert res.status_code == 404
