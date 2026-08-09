import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routers import router as api_router
from app.core.database import engine, Base

import threading
import time
from app.core.database import SessionLocal
from app.services.data_health_service import DataHealthService

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

def start_daily_health_check_loop():
    # Wait 10 seconds initially for uvicorn workers to boot up completely
    time.sleep(10)
    while True:
        try:
            db = SessionLocal()
            DataHealthService.run_daily_health_check(db)
            db.close()
        except Exception as loop_err:
            print(f"[Health Service Loop Error] {loop_err}")
        time.sleep(24 * 3600)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    t = threading.Thread(target=start_daily_health_check_loop, daemon=True)
    t.start()

# Set CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"status": "running", "platform": settings.PROJECT_NAME}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
