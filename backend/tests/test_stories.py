import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_stories(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    res = await async_client.get("/api/projects/p1/stories")
    assert res.status_code == 200
    stories = res.json()
    assert len(stories) > 0
    assert "US-101" in [s["ref"] for s in stories]

@pytest.mark.asyncio
async def test_create_story(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    res = await async_client.post("/api/projects/p1/stories", json={
        "title": "New Story",
        "description": "Desc",
        "acceptance_criteria": ["C1", "C2"],
        "status": "todo",
        "priority": "high",
        "story_points": 5,
        "labels": ["backend"]
    })
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "New Story"
    assert "C1" in data["acceptance_criteria"]
    assert data["ref"].startswith("ATL-")

@pytest.mark.asyncio
async def test_update_story(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    # Get a story to update
    list_res = await async_client.get("/api/projects/p1/stories")
    story_id = list_res.json()[0]["id"]
    
    res = await async_client.patch(f"/api/projects/p1/stories/{story_id}", json={
        "title": "Updated Title",
        "story_points": 8
    })
    assert res.status_code == 200
    assert res.json()["title"] == "Updated Title"
    assert res.json()["story_points"] == 8

@pytest.mark.asyncio
async def test_delete_story(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    list_res = await async_client.get("/api/projects/p1/stories")
    story_id = list_res.json()[0]["id"]
    
    res = await async_client.delete(f"/api/projects/p1/stories/{story_id}")
    assert res.status_code == 204
    
    res = await async_client.get(f"/api/projects/p1/stories/{story_id}")
    assert res.status_code == 404
