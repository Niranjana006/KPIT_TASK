import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_tasks(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    # Using seed data: Priya is member of project p1. Story s1 is in p1.
    res = await async_client.get("/api/stories/s1/tasks")
    assert res.status_code == 200
    tasks = res.json()
    assert len(tasks) > 0
    assert "TASK-201" in [t["ref"] for t in tasks]

@pytest.mark.asyncio
async def test_create_task(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    res = await async_client.post("/api/stories/s1/tasks", json={
        "title": "New Task",
        "description": "Task desc",
        "status": "todo",
        "priority": "high",
        "estimated_hours": 3,
        "labels": ["frontend"]
    })
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "New Task"
    assert data["ref"].startswith("ATL-")

@pytest.mark.asyncio
async def test_update_task(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    # Get a task to update
    list_res = await async_client.get("/api/stories/s1/tasks")
    task_id = list_res.json()[0]["id"]
    
    res = await async_client.patch(f"/api/tasks/{task_id}", json={
        "title": "Updated Task",
        "status": "done"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "Updated Task"
    assert data["status"] == "done"
    assert data["completed_at"] is not None

@pytest.mark.asyncio
async def test_delete_task(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    list_res = await async_client.get("/api/stories/s1/tasks")
    task_id = list_res.json()[0]["id"]
    
    res = await async_client.delete(f"/api/tasks/{task_id}")
    assert res.status_code == 204
    
    res = await async_client.get(f"/api/tasks/{task_id}")
    assert res.status_code == 404
