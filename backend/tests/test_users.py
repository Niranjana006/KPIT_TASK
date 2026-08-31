import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_users(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    res = await async_client.get("/api/users")
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 2
    emails = [u["email"] for u in users]
    assert "priya@flowforge.dev" in emails
    assert "arun@flowforge.dev" in emails

@pytest.mark.asyncio
async def test_update_me(async_client: AsyncClient):
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    res = await async_client.patch("/api/users/me", json={
        "name": "Priya Updated"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Priya Updated"
    
    # Check that GET /me reflects the change
    res2 = await async_client.get("/api/auth/me")
    assert res2.json()["name"] == "Priya Updated"
