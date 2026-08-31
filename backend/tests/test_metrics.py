import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_dashboard_metrics(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    res = await async_client.get("/api/metrics/dashboard")
    assert res.status_code == 200
    data = res.json()
    
    # Check structure
    assert "total_projects" in data
    assert "active_projects" in data
    assert "open_stories" in data
    assert "open_tasks" in data
    assert "completed_tasks" in data
    assert "overdue_tasks" in data
    assert "status_distribution" in data
    assert "project_progress" in data
    assert "upcoming_deadlines" in data
    assert "my_tasks" in data
    assert "open_stories_list" in data
    
    # Based on seed data, Priya is in project p1
    assert data["total_projects"] >= 1
    assert data["active_projects"] >= 1
    assert isinstance(data["project_progress"], list)
    assert len(data["project_progress"]) >= 1

@pytest.mark.asyncio
async def test_dashboard_metrics_unauthorized(async_client: AsyncClient):
    res = await async_client.get("/api/metrics/dashboard")
    assert res.status_code == 401
