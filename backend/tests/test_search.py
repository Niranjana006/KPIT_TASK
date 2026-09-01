import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_global_search(async_client: AsyncClient):
    # Authenticate
    await async_client.post(
        "/api/auth/login",
        json={"email": "priya@flowforge.dev", "password": "password"}
    )
    
    # Search for project name
    response = await async_client.get("/api/search", params={"q": "Atlas Platform"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["projects"]) >= 1
    assert any(p["name"] == "Atlas Platform" for p in data["projects"])

    # Search for empty/no query
    response2 = await async_client.get("/api/search")
    assert response2.status_code == 200
    data2 = response2.json()
    assert len(data2["projects"]) >= 1

@pytest.mark.asyncio
async def test_global_search_unauthorized(async_client: AsyncClient):
    response = await async_client.get("/api/search", params={"q": "Test"})
    assert response.status_code == 401
