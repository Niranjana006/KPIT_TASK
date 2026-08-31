import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient):
    response = await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "flowforge_access_token" in response.cookies

@pytest.mark.asyncio
async def test_login_failure(async_client: AsyncClient):
    response = await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "detail" in response.json()

@pytest.mark.asyncio
async def test_get_me_unauthorized(async_client: AsyncClient):
    response = await async_client.get("/api/auth/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_me_authorized(async_client: AsyncClient):
    # First login to set cookie
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    response = await async_client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "priya@flowforge.dev"
    assert "password_hash" not in data

@pytest.mark.asyncio
async def test_logout(async_client: AsyncClient):
    # Login first
    await async_client.post("/api/auth/login", json={
        "email": "priya@flowforge.dev",
        "password": "password"
    })
    
    # Check we are logged in
    res = await async_client.get("/api/auth/me")
    assert res.status_code == 200
    
    # Logout
    logout_res = await async_client.post("/api/auth/logout")
    assert logout_res.status_code == 204
    
    # Check we are logged out (cookie deleted)
    res2 = await async_client.get("/api/auth/me")
    assert res2.status_code == 401
