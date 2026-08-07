import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routers import router as api_router
from app.core.database import engine, Base

# Create database tables on startup
Base.metadata.create_all(bind=engine)

from app.core.database import SessionLocal
from app.models import models

def seed_db():
    db = SessionLocal()
    try:
        if db.query(models.UserHolding).count() == 0:
            default_holdings = [
                models.UserHolding(
                    asset_class="Stock",
                    symbol="RELIANCE.NS",
                    name="Reliance Industries Ltd.",
                    quantity=120.0,
                    buy_price=2450.50,
                    current_value=2540.20,
                    sector="Energy",
                    country="India",
                    cagr=14.2,
                    volatility=18.5
                ),
                models.UserHolding(
                    asset_class="Stock",
                    symbol="TCS.NS",
                    name="Tata Consultancy Services Ltd.",
                    quantity=80.0,
                    buy_price=3200.00,
                    current_value=3420.50,
                    sector="Technology",
                    country="India",
                    cagr=16.8,
                    volatility=14.2
                ),
                models.UserHolding(
                    asset_class="Stock",
                    symbol="HDFCBANK.NS",
                    name="HDFC Bank Ltd.",
                    quantity=250.0,
                    buy_price=1480.00,
                    current_value=1530.40,
                    sector="Financials",
                    country="India",
                    cagr=12.5,
                    volatility=16.0
                ),
                models.UserHolding(
                    asset_class="Mutual Fund",
                    symbol="NIPPON_SMALL_CAP",
                    name="Nippon India Small Cap Fund",
                    quantity=1500.0,
                    buy_price=120.50,
                    current_value=135.20,
                    sector="Small Cap Equity",
                    country="India",
                    cagr=22.4,
                    volatility=24.5
                ),
            ]
            db.add_all(default_holdings)
            db.commit()
            print("Successfully seeded database with default portfolio holdings.")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

seed_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

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
