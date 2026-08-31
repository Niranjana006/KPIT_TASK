import asyncio
from backend.database import AsyncSessionLocal
from backend.seed import run_seed

async def main():
    async with AsyncSessionLocal() as session:
        await run_seed(session)

if __name__ == "__main__":
    asyncio.run(main())
