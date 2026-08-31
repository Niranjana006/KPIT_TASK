import pytest
from httpx import AsyncClient
from backend.models import User

@pytest.mark.asyncio
async def test_list_projects(async_client: AsyncClient):
    # Login as Priya
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    response = await async_client.get("/api/projects")
    assert response.status_code == 200
    projects = response.json()
    
    assert len(projects) > 0
    # Priya should see Atlas Platform and Insight Reporting based on seed data
    keys = [p["key"] for p in projects]
    assert "ATL" in keys

@pytest.mark.asyncio
async def test_create_project(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    response = await async_client.post("/api/projects", json={
        "key": "NEWP",
        "name": "New Project",
        "description": "Test project",
        "status": "planning",
        "owner_id": "u1"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["key"] == "NEWP"
    assert data["name"] == "New Project"
    # Owner must be automatically set correctly regardless of input
    assert data["owner_id"] == "u1" 
    
    # Check that Priya was added as a member
    assert "u1" in data["member_ids"]

@pytest.mark.asyncio
async def test_get_project(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    # First get the list to find a valid ID
    list_res = await async_client.get("/api/projects")
    projects = list_res.json()
    target_id = projects[0]["id"]
    
    res = await async_client.get(f"/api/projects/{target_id}")
    assert res.status_code == 200
    assert res.json()["id"] == target_id

@pytest.mark.asyncio
async def test_update_project(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    list_res = await async_client.get("/api/projects")
    projects = list_res.json()
    target_id = projects[0]["id"]
    
    res = await async_client.patch(f"/api/projects/{target_id}", json={
        "name": "Updated Name"
    })
    assert res.status_code == 200
    assert res.json()["name"] == "Updated Name"

@pytest.mark.asyncio
async def test_delete_project_not_owner(async_client: AsyncClient):
    # Login as someone who is not owner of p1 (Atlas)
    # p1 is owned by u1 (Priya), so we login as Arun (u2)
    await async_client.post("/api/auth/login", json={
        "email": "arun@flowforge.dev",
        "password": "password"
    })
    
    res = await async_client.delete("/api/projects/p1")
    # Arun is a member, but not owner, so he shouldn't be able to delete it
    assert res.status_code == 404

@pytest.mark.asyncio
async def test_delete_project_owner(async_client: AsyncClient):
    # Login as Priya (u1)
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    res = await async_client.delete("/api/projects/p1")
    assert res.status_code == 204
    
    # Verify it's gone
    res = await async_client.get("/api/projects/p1")
    assert res.status_code == 404
