import time
import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import init_connection_pool, close_connection_pool
from backend.app.routers import overview, products, orders, agent, report, auth

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nexus.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize CockroachDB pool
    logger.info("Starting NexusCommerce AI backend service...")
    init_connection_pool()
    yield
    # Shutdown: clean up pool
    logger.info("Shutting down NexusCommerce AI backend service...")
    close_connection_pool()

app = FastAPI(
    title="NexusCommerce AI Enterprise API",
    version="1.0.0",
    description="Enterprise Analytics & Autonomous AI Agent Backend for CockroachDB Olist Dataset",
    lifespan=lifespan
)

# 1. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Retry-After", "Content-Disposition"]
)

# 2. Security Headers & Request ID Middleware
@app.middleware("http")
async def security_and_tracing_middleware(request: Request, call_next):
    req_id = str(uuid.uuid4())
    request.state.request_id = req_id
    start_time = time.time()

    response = await call_next(request)

    duration = round((time.time() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Response-Time-MS"] = str(duration)

    # Hardened Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"

    logger.info(
        "%s %s -> %d (%dms) [req_id=%s]",
        request.method, request.url.path, response.status_code, duration, req_id
    )
    return response

# 3. Global Exception Handler (No stack traces to client)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    logger.error("Unhandled exception on %s [req_id=%s]: %s", request.url.path, req_id, str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error occurred.",
            "request_id": req_id,
            "timestamp": time.time()
        }
    )

# 4. Mount Routers
app.include_router(auth.router)
app.include_router(overview.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(agent.router)
app.include_router(report.router)

# 5. Harmless Health Check
@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "healthy",
        "service": "NexusCommerce AI",
        "cluster": "CockroachDB CCL v26.2.9",
        "timestamp": time.time()
    }
