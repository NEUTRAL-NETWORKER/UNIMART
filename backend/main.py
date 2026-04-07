from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import redis
import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models import UserProfile
from routers import auth, products, orders, chat, otp, admin, upload, notifications
from scheduler import start_scheduler, stop_scheduler
from seed_data import seed_official_records
from admin_auth import seed_super_admin
from admin_models import AdminAccount, AdminAuditLog
from settings import is_production


logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("unimart.api")


# ============================================================
# APP LIFESPAN (Startup & Shutdown)
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: scheduler should run in exactly one process.
    scheduler_enabled = os.getenv("ENABLE_SCHEDULER", "false").lower() == "true"
    if scheduler_enabled:
        start_scheduler()
        logger.info("Scheduler enabled for this process")
    
    # Auto-seed official records if empty
    try:
        seed_official_records()
        logger.info("Database seeding check completed")
    except Exception as e:
        logger.exception("Error during auto-seeding")

    # Seed super admin account
    try:
        from database import SessionLocal
        db = SessionLocal()
        try:
            seed_super_admin(db)
        finally:
            db.close()
        logger.info("Admin account check completed")
    except Exception as e:
        logger.exception("Admin seeding failed")
        
    logger.info("Unimart API is ready")
    yield
    # SHUTDOWN: Stop scheduler
    if scheduler_enabled:
        stop_scheduler()


# ============================================================
# APP INITIALIZATION
# ============================================================

app = FastAPI(
    title="Unimart API",
    description="Secure Student-to-Student Marketplace Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Static mount for development upload fallback.
uploads_dir = Path(__file__).resolve().parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# ============================================================
# CORS MIDDLEWARE (Environment-based origins)
# ============================================================

# Default development origins
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Get additional origins from environment variable (comma-separated)
EXTRA_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",")
EXTRA_ORIGINS = [origin.strip() for origin in EXTRA_ORIGINS if origin.strip()]

# Combine origins
if is_production():
    ALLOWED_ORIGINS = EXTRA_ORIGINS
    if not ALLOWED_ORIGINS:
        raise RuntimeError("CORS_ORIGINS must be set in production environment.")
else:
    ALLOWED_ORIGINS = DEFAULT_ORIGINS + EXTRA_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# EXCEPTION HANDLERS (To preserve CORS on unhandled exceptions)
# ============================================================

@app.exception_handler(redis.RedisError)
async def redis_exception_handler(request: Request, exc: redis.RedisError):
    logger.exception("Redis exception caught")
    return JSONResponse(
        status_code=500,
        content={"detail": "Cache/Database connection failed. Please try again later."},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception caught")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error. Please contact support."},
    )

# ============================================================
# REGISTER ALL ROUTERS (under /api prefix)
# ============================================================

app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(otp.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")


# ============================================================
# ROOT ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {
        "app": "Unimart API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    student_count = db.query(UserProfile).count()
    return {"registeredStudents": student_count}
