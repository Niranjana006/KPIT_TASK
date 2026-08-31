"""
main.py — FastAPI application factory and entrypoint.

Registers CORS middleware, startup/shutdown events, and routers.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.database import init_db
from backend.routers import auth, projects, stories, tasks, users, notifications, activity, metrics, jobs
from backend.schemas import ErrorResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    from backend.workers.job_runner import start_scheduler, stop_scheduler
    
    # Startup: Ensure tables exist
    await init_db()
    
    # Initialize background task scheduler
    start_scheduler()
    
    yield
    
    # Shutdown logic
    stop_scheduler()


app = FastAPI(
    title="FlowForge API",
    description="Agile Project Management Tool API for KPIT evaluation.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
# Allows the Vite development server to communicate with the backend
# and send the httpOnly authentication cookie.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---------------------------------------------------------------------------
# Global Exception Handlers
# ---------------------------------------------------------------------------

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error="HTTP Error",
            message=str(exc.detail),
            detail=None
        ).model_dump()
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error="Validation Error",
            message="Invalid request data",
            detail=exc.errors()
        ).model_dump()
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Log exception here in production
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal Server Error",
            message="An unexpected error occurred.",
            detail=None # Do not expose stack traces
        ).model_dump()
    )

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(stories.router, prefix="/api")
app.include_router(tasks.router)
app.include_router(users.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(activity.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")

@app.get("/api/health", tags=["health"])
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}
