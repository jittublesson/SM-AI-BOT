from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.schemas import schemas
from app.models import models

# Import services
from app.services.education_service import EducationService
from app.services.yfinance_service import YFinanceService
from app.services.agent_coordinator import AgentCoordinator
from app.services.document_service import DocumentService
from app.services.valuation_service import ValuationService
from app.services.portfolio_service import PortfolioService
from app.services.strategy_service import StrategyService
from app.services.news_service import NewsService
from app.services.macro_service import MacroService
from app.services.score_service import ScoreService
from app.services.chat_service import ChatService
from app.services.mutual_fund_service import MutualFundService

router = APIRouter()

# --- Expanded global ticker search index ---
TICKER_INDEX = [
    # US Technology
    {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Technology", "exchange": "NASDAQ"},
    {"ticker": "MSFT", "name": "Microsoft Corporation", "sector": "Technology", "exchange": "NASDAQ"},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "sector": "Technology", "exchange": "NASDAQ"},
    {"ticker": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Discretionary", "exchange": "NASDAQ"},
    {"ticker": "META", "name": "Meta Platforms Inc.", "sector": "Technology", "exchange": "NASDAQ"},
    {"ticker": "NVDA", "name": "NVIDIA Corporation", "sector": "Semiconductors", "exchange": "NASDAQ"},
    {"ticker": "TSLA", "name": "Tesla Inc.", "sector": "Automotive", "exchange": "NASDAQ"},
    {"ticker": "NFLX", "name": "Netflix Inc.", "sector": "Communication Services", "exchange": "NASDAQ"},
    {"ticker": "AMD", "name": "Advanced Micro Devices", "sector": "Semiconductors", "exchange": "NASDAQ"},
    {"ticker": "INTC", "name": "Intel Corporation", "sector": "Semiconductors", "exchange": "NASDAQ"},
    # US Financials & Healthcare
    {"ticker": "JPM", "name": "JPMorgan Chase & Co.", "sector": "Financials", "exchange": "NYSE"},
    {"ticker": "GS", "name": "Goldman Sachs Group", "sector": "Financials", "exchange": "NYSE"},
    {"ticker": "BAC", "name": "Bank of America Corp.", "sector": "Financials", "exchange": "NYSE"},
    {"ticker": "JNJ", "name": "Johnson & Johnson", "sector": "Healthcare", "exchange": "NYSE"},
    {"ticker": "PFE", "name": "Pfizer Inc.", "sector": "Healthcare", "exchange": "NYSE"},
    {"ticker": "UNH", "name": "UnitedHealth Group", "sector": "Healthcare", "exchange": "NYSE"},
    # US Industrials & Energy
    {"ticker": "XOM", "name": "ExxonMobil Corporation", "sector": "Energy", "exchange": "NYSE"},
    {"ticker": "CVX", "name": "Chevron Corporation", "sector": "Energy", "exchange": "NYSE"},
    {"ticker": "BA", "name": "Boeing Company", "sector": "Industrials", "exchange": "NYSE"},
    {"ticker": "CAT", "name": "Caterpillar Inc.", "sector": "Industrials", "exchange": "NYSE"},
    # Indian Stocks (NSE)
    {"ticker": "RELIANCE.NS", "name": "Reliance Industries Ltd.", "sector": "Energy / Conglomerate", "exchange": "NSE"},
    {"ticker": "INFY", "name": "Infosys Ltd.", "sector": "Technology", "exchange": "NSE"},
    {"ticker": "TCS.NS", "name": "Tata Consultancy Services", "sector": "Technology", "exchange": "NSE"},
    {"ticker": "HDFCBANK.NS", "name": "HDFC Bank Ltd.", "sector": "Financials", "exchange": "NSE"},
    {"ticker": "ICICIBANK.NS", "name": "ICICI Bank Ltd.", "sector": "Financials", "exchange": "NSE"},
    {"ticker": "WIPRO.NS", "name": "Wipro Ltd.", "sector": "Technology", "exchange": "NSE"},
    {"ticker": "HCLTECH.NS", "name": "HCL Technologies", "sector": "Technology", "exchange": "NSE"},
    {"ticker": "TATAMOTORS.NS", "name": "Tata Motors Ltd.", "sector": "Automotive", "exchange": "NSE"},
    {"ticker": "TATASTEEL.NS", "name": "Tata Steel Ltd.", "sector": "Materials", "exchange": "NSE"},
    {"ticker": "SUNPHARMA.NS", "name": "Sun Pharmaceutical", "sector": "Healthcare", "exchange": "NSE"},
    {"ticker": "BAJFINANCE.NS", "name": "Bajaj Finance Ltd.", "sector": "Financials", "exchange": "NSE"},
    {"ticker": "MARUTI.NS", "name": "Maruti Suzuki India", "sector": "Automotive", "exchange": "NSE"},
    {"ticker": "ADANIPORTS.NS", "name": "Adani Ports & SEZ", "sector": "Industrials", "exchange": "NSE"},
    {"ticker": "LTIM.NS", "name": "LTIMindtree Ltd.", "sector": "Technology", "exchange": "NSE"},
    # Global
    {"ticker": "BABA", "name": "Alibaba Group Holding", "sector": "Consumer Discretionary", "exchange": "NYSE"},
    {"ticker": "TSM", "name": "Taiwan Semiconductor Mfg.", "sector": "Semiconductors", "exchange": "NYSE"},
    {"ticker": "ASML", "name": "ASML Holding N.V.", "sector": "Semiconductors", "exchange": "NASDAQ"},
    {"ticker": "NVO", "name": "Novo Nordisk A/S", "sector": "Healthcare", "exchange": "NYSE"},
    {"ticker": "SAP", "name": "SAP SE", "sector": "Technology", "exchange": "NYSE"},
]

# --- 1. Education Academy Routers ---
@router.get("/education/lessons", response_model=List[schemas.Lesson])
def get_lessons(level: Optional[str] = None):
    return EducationService.get_all_lessons(level)

@router.get("/education/lessons/{slug}", response_model=schemas.Lesson)
def get_lesson(slug: str):
    lesson = EducationService.get_lesson_by_slug(slug)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.get("/education/progress", response_model=List[schemas.ProgressResponse])
def get_progress(db: Session = Depends(get_db)):
    progress_list = db.query(models.UserProgress).all()
    return progress_list

@router.post("/education/complete", response_model=schemas.ProgressResponse)
def complete_lesson(req: schemas.ProgressCompleteRequest, db: Session = Depends(get_db)):
    db_progress = db.query(models.UserProgress).filter(models.UserProgress.lesson_slug == req.lesson_slug).first()
    if not db_progress:
        db_progress = models.UserProgress(lesson_slug=req.lesson_slug, completed=req.completed)
        db.add(db_progress)
    else:
        db_progress.completed = req.completed
    db.commit()
    db.refresh(db_progress)
    return db_progress


# --- 2. Fundamental Analyst & Scoring Routers ---
@router.get("/analyst/search")
def search_stocks(q: str = Query(..., min_length=1)):
    """Full-text search across 40+ global and Indian stock tickers."""
    query = q.lower().strip()
    matches = [
        t for t in TICKER_INDEX
        if query in t["ticker"].lower() or query in t["name"].lower() or query in t["sector"].lower()
    ]
    return matches[:15]  # Cap at 15 results for UI performance

@router.get("/analyst/profile/{ticker}")
def get_stock_profile(ticker: str):
    # Returns raw stock data and company health score
    stock_data = YFinanceService.get_stock_data(ticker)
    score_data = ScoreService.evaluate_company_score(ticker)
    coordinated = AgentCoordinator.generate_coordinated_report(ticker, DocumentService.query_filings)
    return {
        "profile": stock_data,
        "score": score_data,
        "agent_report": coordinated
    }


# --- 3. Annual Report & Document Routers ---
@router.get("/reports/highlights")
def get_reports_highlights(ticker: str):
    # YoY promise audits and accounting checks
    return DocumentService.analyze_promises_and_accounting(ticker)

@router.post("/reports/query")
def query_reports(ticker: str, req: schemas.ChatRequest):
    # Document citation queries
    return DocumentService.query_filings(ticker, req.message)


# --- 4. Portfolio Manager Routers ---
@router.post("/portfolio/advise", response_model=schemas.PortfolioResponse)
def get_portfolio_advice(req: schemas.PortfolioRequest):
    return PortfolioService.get_portfolio_advice(
        age=req.age,
        income=req.income,
        savings=req.savings,
        risk_tolerance=req.risk_tolerance,
        horizon=req.horizon,
        goals=req.goals,
        existing_investments=req.existing_investments
    )


# --- 5. Technical Analyst Routers ---
@router.get("/technical/analyze", response_model=schemas.TechnicalResponse)
def analyze_technical(ticker: str):
    prices = YFinanceService.get_stock_prices_history(ticker)
    
    # Calculate simple indicator support resistance metrics
    last_price = prices[-1] if prices else 100.0
    support_levels = [round(last_price * 0.95, 2), round(last_price * 0.90, 2)]
    resistance_levels = [round(last_price * 1.05, 2), round(last_price * 1.10, 2)]
    
    # Simple pattern detect
    patterns = ["200 EMA Support Bounce", "Ascending Channel Formation"]
    if len(prices) > 20 and prices[-1] > prices[-5]:
        patterns.append("Short-term Bullish Flags")
        
    indicators = {
        "rsi": 58.5,
        "macd_line": 1.24,
        "signal_line": 0.85,
        "ema_20": round(last_price * 0.99, 2),
        "sma_50": round(last_price * 0.97, 2),
        "atr_14": round(last_price * 0.02, 2),
        "adx_14": 22.4,
        "vwap": round(last_price * 0.995, 2)
    }
    
    return {
        "trend": "Bullish Momentum" if last_price > prices[0] else "Consolidation / Sideways",
        "support_levels": support_levels,
        "resistance_levels": resistance_levels,
        "demand_zones": [f"Price range between ${support_levels[1]} and ${support_levels[0]}"],
        "supply_zones": [f"Price range between ${resistance_levels[0]} and ${resistance_levels[1]}"],
        "patterns_detected": patterns,
        "indicators": indicators,
        "bull_scenario": "Breakout above immediate resistance targets next structural high.",
        "bear_scenario": "Breakdown below support invalidates current demand consolidation.",
        "neutral_scenario": "Range-bound trading within support-resistance channel.",
        "confirmation_levels": [resistance_levels[0]],
        "invalidation_levels": [support_levels[0]],
        "risk_factors": ["High beta adjustments in tech indices", "Impending earnings announcements volatility"],
        "probability_estimates": "Bullish: 60% | Bearish: 25% | Neutral: 15%"
    }


# --- 6. Trading Strategy Builder Routers ---
@router.post("/strategy/generate", response_model=schemas.BacktestResponse)
def generate_strategy(req: schemas.BacktestRequest):
    return StrategyService.generate_strategy_and_backtest(
        ticker="AAPL", # Default reference ticker
        indicators=req.indicators,
        stop_loss_pct=req.stop_loss_pct,
        take_profit_pct=req.take_profit_pct,
        entry_rules=req.entry_rules,
        exit_rules=req.exit_rules,
        risk_rules=req.risk_rules,
        position_sizing=req.position_sizing
    )


# --- 7. News & Sentiment Routers ---
@router.get("/news/feed", response_model=schemas.NewsSentimentResponse)
def get_news_feed(ticker: Optional[str] = None):
    return NewsService.get_market_sentiment(ticker)


# --- 8. Macro Indicators Routers ---
@router.get("/macro/indicators")
def get_macro_indicators():
    return MacroService.get_macro_intel()


# --- 9. Valuation Engine Routers ---
@router.post("/valuation/calculate", response_model=schemas.DCFResponse)
def calculate_valuation(ticker: str, req: schemas.DCFRequest):
    return ValuationService.calculate_dcf(
        ticker=ticker,
        growth_rate_stage1=req.growth_rate_stage1,
        growth_rate_stage2=req.growth_rate_stage2,
        discount_rate=req.discount_rate,
        terminal_growth_rate=req.terminal_growth_rate,
        projection_years=req.projection_years
    )


# --- 10. AI Copilot Chat Routers ---
@router.post("/chat/query", response_model=schemas.ChatResponse)
def query_chat(req: schemas.ChatRequest):
    return ChatService.process_chat_query(req.message, req.ticker)


# --- 11. Bookmarks Routers ---
@router.get("/bookmarks", response_model=List[schemas.BookmarkResponse])
def get_bookmarks(db: Session = Depends(get_db)):
    return db.query(models.UserBookmark).all()

@router.post("/bookmarks", response_model=schemas.BookmarkResponse)
def create_bookmark(req: schemas.BookmarkCreate, db: Session = Depends(get_db)):
    db_bookmark = models.UserBookmark(
        ticker=req.ticker,
        type=req.type,
        title=req.title,
        url=req.url,
        created_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(db_bookmark)
    db.commit()
    db.refresh(db_bookmark)
    return db_bookmark

@router.delete("/bookmarks/{id}")
def delete_bookmark(id: int, db: Session = Depends(get_db)):
    db_bookmark = db.query(models.UserBookmark).filter(models.UserBookmark.id == id).first()
    if not db_bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(db_bookmark)
    db.commit()
    return {"status": "deleted"}


# --- 12. Watchlist CRUD Routers ---
@router.get("/watchlist", response_model=List[schemas.WatchlistResponse])
def get_watchlist(db: Session = Depends(get_db)):
    """Retrieve all items in the investor watchlist."""
    return db.query(models.WatchlistItem).all()

@router.post("/watchlist", response_model=schemas.WatchlistResponse)
def add_to_watchlist(req: schemas.WatchlistCreate, db: Session = Depends(get_db)):
    """Add a ticker to the watchlist with optional target price and alert settings."""
    existing = db.query(models.WatchlistItem).filter(models.WatchlistItem.ticker == req.ticker.upper()).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"{req.ticker.upper()} is already in your watchlist.")
    
    # Auto-populate name and sector from ticker index if not provided
    ticker_meta = next((t for t in TICKER_INDEX if t["ticker"] == req.ticker.upper()), None)
    item_name = req.name or (ticker_meta["name"] if ticker_meta else req.ticker.upper())
    item_sector = req.sector or (ticker_meta["sector"] if ticker_meta else "Equity")
    
    db_item = models.WatchlistItem(
        ticker=req.ticker.upper(),
        name=item_name,
        sector=item_sector,
        target_price=req.target_price,
        alert_threshold_pct=req.alert_threshold_pct,
        notes=req.notes,
        added_at=datetime.utcnow().strftime("%Y-%m-%d")
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.patch("/watchlist/{id}", response_model=schemas.WatchlistResponse)
def update_watchlist_item(id: int, req: schemas.WatchlistUpdate, db: Session = Depends(get_db)):
    """Update target price, alert threshold, or notes for a watchlist item."""
    db_item = db.query(models.WatchlistItem).filter(models.WatchlistItem.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    if req.target_price is not None:
        db_item.target_price = req.target_price
    if req.alert_threshold_pct is not None:
        db_item.alert_threshold_pct = req.alert_threshold_pct
    if req.notes is not None:
        db_item.notes = req.notes
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/watchlist/{id}")
def remove_from_watchlist(id: int, db: Session = Depends(get_db)):
    """Remove a ticker from the watchlist."""
    db_item = db.query(models.WatchlistItem).filter(models.WatchlistItem.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    db.delete(db_item)
    db.commit()
    return {"status": "removed", "ticker": db_item.ticker}


# --- 13. Quick Price Snapshot Router ---
@router.get("/analyst/price/{ticker}")
def get_quick_price(ticker: str):
    """Lightweight endpoint returning just current price and daily change for the ticker strip."""
    stock_data = YFinanceService.get_stock_data(ticker)
    info = stock_data.get("info", {})
    financials = stock_data.get("financials", [])
    latest = financials[0] if financials else {}
    return {
        "ticker": ticker.upper(),
        "name": info.get("name", ticker.upper()),
        "price": info.get("price", 0.0),
        "market_cap": info.get("market_cap", 0.0),
        "currency": info.get("currency", "INR" if ".NS" in ticker.upper() or ".BO" in ticker.upper() else "USD"),
        "sector": info.get("sector", "Equity"),
        "pe_ratio": round(info.get("price", 100) / latest.get("eps", 1.0), 2) if latest.get("eps") else None,
        "roe": latest.get("roe"),
        "net_margin": latest.get("net_margin")
    }


# --- 14. Research Journal CRUD Routers ---
@router.get("/journal", response_model=List[schemas.JournalResponse])
def get_journal_entries(ticker: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all journal entries, optionally filtered by ticker."""
    q = db.query(models.ResearchJournalEntry)
    if ticker:
        q = q.filter(models.ResearchJournalEntry.ticker == ticker.upper())
    return q.order_by(models.ResearchJournalEntry.id.desc()).all()

@router.get("/journal/{id}", response_model=schemas.JournalResponse)
def get_journal_entry(id: int, db: Session = Depends(get_db)):
    """Get a specific journal entry by ID."""
    entry = db.query(models.ResearchJournalEntry).filter(models.ResearchJournalEntry.id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry

@router.post("/journal", response_model=schemas.JournalResponse)
def create_journal_entry(req: schemas.JournalCreate, db: Session = Depends(get_db)):
    """Create a new investment journal entry."""
    now = datetime.utcnow().strftime("%Y-%m-%d")
    # Auto-populate company name from ticker index if not provided
    ticker_meta = next((t for t in TICKER_INDEX if t["ticker"] == req.ticker.upper()), None)
    company_name = req.company_name or (ticker_meta["name"] if ticker_meta else req.ticker.upper())
    entry = models.ResearchJournalEntry(
        ticker=req.ticker.upper(),
        company_name=company_name,
        idea_date=now,
        status=req.status or "Active",
        investment_thesis=req.investment_thesis,
        bull_case=req.bull_case,
        base_case=req.base_case,
        bear_case=req.bear_case,
        expected_cagr=req.expected_cagr,
        entry_price=req.entry_price,
        target_price=req.target_price,
        stop_loss=req.stop_loss,
        risks=req.risks,
        catalysts=req.catalysts,
        conviction_score=req.conviction_score or 5,
        holding_period=req.holding_period,
        actual_outcome=req.actual_outcome,
        lessons_learned=req.lessons_learned,
        last_updated=now
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.patch("/journal/{id}", response_model=schemas.JournalResponse)
def update_journal_entry(id: int, req: schemas.JournalUpdate, db: Session = Depends(get_db)):
    """Update a journal entry with new thesis, cases, or review notes."""
    entry = db.query(models.ResearchJournalEntry).filter(models.ResearchJournalEntry.id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    update_fields = req.model_dump(exclude_unset=True)
    for field, val in update_fields.items():
        if val is not None:
            setattr(entry, field, val)
    entry.last_updated = datetime.utcnow().strftime("%Y-%m-%d")
    db.commit()
    db.refresh(entry)
    return entry

@router.delete("/journal/{id}")
def delete_journal_entry(id: int, db: Session = Depends(get_db)):
    """Delete a journal entry permanently."""
    entry = db.query(models.ResearchJournalEntry).filter(models.ResearchJournalEntry.id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    db.delete(entry)
    db.commit()
    return {"status": "deleted", "ticker": entry.ticker}


# --- 15. Market Intelligence Center Router ---
@router.get("/market/intelligence")
def get_market_intelligence():
    """
    Comprehensive market intelligence dashboard data:
    global indices, sector rotation, economic calendar, commodities, FII/DII flows.
    """
    return {
        "global_indices": [
            {"name": "S&P 500",    "value": "5,482.87", "change": "+0.45%", "trend": "up"},
            {"name": "NASDAQ",     "value": "17,890.78","change": "+0.72%", "trend": "up"},
            {"name": "DOW JONES",  "value": "38,901.34","change": "-0.12%", "trend": "down"},
            {"name": "FTSE 100",   "value": "8,214.45", "change": "+0.28%", "trend": "up"},
            {"name": "Nikkei 225", "value": "38,765.20","change": "+0.91%", "trend": "up"},
            {"name": "DAX",        "value": "18,492.34","change": "+0.34%", "trend": "up"},
            {"name": "SENSEX",     "value": "79,402.15","change": "+0.55%", "trend": "up"},
            {"name": "NIFTY 50",   "value": "24,057.45","change": "+0.48%", "trend": "up"},
        ],
        "sector_performance": [
            {"sector": "Technology",          "change": "+1.82%", "trend": "up",   "signal": "Accumulate"},
            {"sector": "Healthcare",           "change": "+0.94%", "trend": "up",   "signal": "Overweight"},
            {"sector": "Financials",           "change": "+0.61%", "trend": "up",   "signal": "Neutral"},
            {"sector": "Consumer Discretionary","change": "-0.28%","trend": "down", "signal": "Neutral"},
            {"sector": "Energy",               "change": "-0.82%", "trend": "down", "signal": "Underweight"},
            {"sector": "Real Estate",          "change": "-1.14%", "trend": "down", "signal": "Reduce"},
            {"sector": "Utilities",            "change": "+0.23%", "trend": "up",   "signal": "Neutral"},
            {"sector": "Materials",            "change": "-0.41%", "trend": "down", "signal": "Neutral"},
            {"sector": "Industrials",          "change": "+0.55%", "trend": "up",   "signal": "Overweight"},
            {"sector": "Communication Svcs",   "change": "+1.23%", "trend": "up",   "signal": "Accumulate"},
        ],
        "commodities": [
            {"name": "Brent Crude ($/bbl)", "value": "$78.45",   "change": "+0.82%", "trend": "up"},
            {"name": "Gold ($/oz)",          "value": "$2,350.20","change": "+0.14%", "trend": "up"},
            {"name": "Silver ($/oz)",        "value": "$28.92",   "change": "+0.31%", "trend": "up"},
            {"name": "Natural Gas",          "value": "$2.84",    "change": "-1.20%", "trend": "down"},
            {"name": "Copper ($/lb)",        "value": "$4.52",    "change": "+0.60%", "trend": "up"},
            {"name": "WTI Crude ($/bbl)",    "value": "$74.20",   "change": "+0.78%", "trend": "up"},
        ],
        "fixed_income": [
            {"name": "US 10Y Yield",    "value": "4.12%", "change": "-2bps",  "trend": "down"},
            {"name": "US 2Y Yield",     "value": "4.82%", "change": "+1bps",  "trend": "up"},
            {"name": "India 10Y GSec",  "value": "6.94%", "change": "-1bps",  "trend": "down"},
            {"name": "DXY (Dollar Index)","value": "104.25","change": "+0.21%","trend": "up"},
        ],
        "fii_dii_flows": {
            "fii_net_today_cr": -1420.5,
            "dii_net_today_cr": +2180.3,
            "fii_net_month_cr": -8240.0,
            "dii_net_month_cr": +12450.0,
            "fii_ytd_cr": -24800.0,
            "dii_ytd_cr": +38200.0,
            "summary": "Domestic institutions are absorbing FII selling pressure. Net market liquidity remains supported by DII accumulation in large-cap defensives and banking sector."
        },
        "market_breadth": {
            "advances": 1428,
            "declines": 652,
            "unchanged": 186,
            "new_highs_52w": 84,
            "new_lows_52w": 23,
            "advance_decline_ratio": 2.19,
            "breadth_signal": "Bullish — Broad-based participation across indices"
        },
        "ipo_calendar": [
            {"company": "Ola Electric (IPO)", "date": "2026-07-20", "price_band": "Rs 72–76", "size_cr": 6145, "status": "Open"},
            {"company": "FirstCry (IPO)",      "date": "2026-08-05", "price_band": "Rs 440–465","size_cr": 4194, "status": "Upcoming"},
            {"company": "Swiggy (IPO)",        "date": "2026-08-12", "price_band": "Rs 371–390","size_cr": 11327,"status": "Upcoming"},
        ],
        "economic_calendar": [
            {"event": "US CPI Inflation Report",    "date": "2026-07-15", "forecast": "2.4%",  "prior": "2.6%",  "impact": "High"},
            {"event": "India IIP Output Data",      "date": "2026-07-12", "forecast": "4.1%",  "prior": "3.8%",  "impact": "Medium"},
            {"event": "Federal Reserve FOMC Meet",  "date": "2026-07-28", "forecast": "5.25%", "prior": "5.25%", "impact": "Critical"},
            {"event": "India RBI Policy Review",    "date": "2026-08-08", "forecast": "6.50%", "prior": "6.50%", "impact": "High"},
            {"event": "US GDP Q2 Advance Estimate", "date": "2026-07-25", "forecast": "2.1%",  "prior": "1.6%",  "impact": "High"},
            {"event": "Eurozone PMI Composite",     "date": "2026-07-23", "forecast": "50.4",  "prior": "49.8",  "impact": "Medium"},
        ],
        "ai_market_summary": (
            "Global equities trade with a mild risk-on bias as inflation data continues to moderate toward central bank targets. "
            "Technology and Communication Services lead sector performance, supported by strong AI capex cycle visibility. "
            "Domestic institutional flows in India remain robust, absorbing FII net selling with DII purchases providing price support. "
            "Key risk: FOMC meeting on July 28 could reintroduce rate uncertainty. Watch US CPI print closely.\n\n"
            "**Consensus Positioning**: Overweight Technology, Industrials, and Healthcare. Underweight Energy and Real Estate."
        ),
        "volatility": {
            "vix": 14.82,
            "vix_label": "Low Volatility (Risk-On)",
            "india_vix": 12.45,
            "fear_greed_score": 72,
            "fear_greed_label": "Greed"
        }
    }


# --- 16. Company Extended Profile (Management, Shareholding, Corporate Actions) ---
@router.get("/analyst/extended/{ticker}")
def get_extended_profile(ticker: str):
    """Extended company workspace data: management team, shareholding pattern, corporate actions."""
    stock_data = YFinanceService.get_stock_data(ticker)
    info = stock_data.get("info", {})
    fin = stock_data.get("financials", [{}])[0]
    price = info.get("price", 100.0)

    return {
        "management": [
            {"name": "Chief Executive Officer",      "role": "CEO",    "tenure": "8 years",  "background": "Ex-McKinsey, Harvard MBA, 25+ years industry experience"},
            {"name": "Chief Financial Officer",      "role": "CFO",    "tenure": "5 years",  "background": "CA, CPA, former Goldman Sachs investment banker"},
            {"name": "Chief Technology Officer",     "role": "CTO",    "tenure": "3 years",  "background": "Former Google VP Engineering, Stanford PhD"},
            {"name": "Independent Director",         "role": "IND-DIR","tenure": "4 years",  "background": "Former RBI Deputy Governor, macroeconomics specialist"},
            {"name": "Chief Operating Officer",      "role": "COO",    "tenure": "6 years",  "background": "Operations veteran, supply chain and logistics expertise"},
        ],
        "shareholding": {
            "promoter": info.get("promoter_holding", 52.4),
            "fii": info.get("fii_holding", 22.8),
            "dii": info.get("dii_holding", 18.2),
            "retail_public": round(100 - info.get("promoter_holding", 52.4) - info.get("fii_holding", 22.8) - info.get("dii_holding", 18.2), 2),
            "pledged_pct": info.get("pledged_shares_percent", 0.0),
            "trend": "FII holdings increased by 0.4% in the last quarter, indicating renewed institutional interest.",
        },
        "corporate_actions": [
            {"type": "Dividend",     "date": "2026-05-15", "details": "Final dividend of Rs 9.5 per share declared", "impact": "Positive"},
            {"type": "Bonus Issue",  "date": "2025-11-01", "details": "1:1 bonus shares issued to existing shareholders", "impact": "Neutral"},
            {"type": "Stock Split",  "date": "2024-08-14", "details": "2:1 stock split — share count doubled", "impact": "Neutral"},
            {"type": "Buyback",      "date": "2024-02-28", "details": "Rs 10,000 Cr buyback at Rs 420 per share", "impact": "Positive"},
            {"type": "Rights Issue", "date": "2023-07-12", "details": "1:15 rights issue at Rs 1,222 per share", "impact": "Dilutive"},
        ],
        "credit_ratings": [
            {"agency": "CRISIL", "rating": "AAA", "outlook": "Stable",  "instrument": "Long-Term Debt"},
            {"agency": "ICRA",   "rating": "AA+", "outlook": "Positive","instrument": "Commercial Paper"},
            {"agency": "Moody's","rating": "Baa1","outlook": "Stable",  "instrument": "Foreign Currency Bonds"},
        ],
        "industry_analysis": {
            "industry": info.get("industry", "Diversified"),
            "market_size_bn": 485.0,
            "market_growth_rate": 8.4,
            "company_market_share_pct": round((info.get("market_cap", 1e12) / (485e9 * 82)) * 100, 2),
            "competitive_intensity": "High",
            "barriers_to_entry": "Very High — capital-intensive with regulatory moats",
            "key_trends": [
                "AI/ML integration across core business segments",
                "Expansion into tier-2 and tier-3 markets",
                "ESG compliance becoming a competitive differentiator",
                "Consolidation wave creating M&A opportunities"
            ],
            "peer_multiples": {
                "sector_median_pe": 28.4,
                "sector_median_pb": 4.2,
                "sector_median_ev_ebitda": 18.6,
            }
        },
        "quarterly_results": [
            {"quarter": "Q4 FY25", "revenue": round(fin.get("revenue", 400000)/4, 0), "pat": round(fin.get("pat", 100000)/4, 0), "eps": round(fin.get("eps", 6.5)/4, 2), "qoq_change": "+4.2%", "yoy_change": "+8.5%"},
            {"quarter": "Q3 FY25", "revenue": round(fin.get("revenue", 400000)/4.2, 0), "pat": round(fin.get("pat", 100000)/4.2, 0), "eps": round(fin.get("eps", 6.5)/4.2, 2), "qoq_change": "+2.8%", "yoy_change": "+6.1%"},
            {"quarter": "Q2 FY25", "revenue": round(fin.get("revenue", 400000)/4.5, 0), "pat": round(fin.get("pat", 100000)/4.5, 0), "eps": round(fin.get("eps", 6.5)/4.5, 2), "qoq_change": "+1.5%", "yoy_change": "+5.4%"},
            {"quarter": "Q1 FY25", "revenue": round(fin.get("revenue", 400000)/4.8, 0), "pat": round(fin.get("pat", 100000)/4.8, 0), "eps": round(fin.get("eps", 6.5)/4.8, 2), "qoq_change": "+3.1%", "yoy_change": "+7.2%"},
        ],
        "investor_presentations": [
            {"title": "Q4 FY25 Investor Presentation",  "date": "2025-05-15", "type": "Quarterly"},
            {"title": "Annual Investor Day 2025",        "date": "2025-03-10", "type": "Annual Event"},
            {"title": "ESG & Sustainability Report",     "date": "2025-01-20", "type": "ESG"},
            {"title": "Analyst Day: 5-Year Strategy",   "date": "2024-11-08", "type": "Strategy"},
        ]
    }


# --- 17. Mutual Fund Ecosystem Routers ---
@router.get("/funds/search")
def search_funds(q: str = Query(..., min_length=1)):
    """Search mutual funds in the registry."""
    return MutualFundService.search_funds(q)

@router.get("/funds/profile/{fund_id}")
def get_fund_profile(fund_id: str):
    """Retrieve detailed mutual fund metadata."""
    fund = MutualFundService.get_fund_by_id(fund_id)
    if not fund:
        raise HTTPException(status_code=404, detail="Mutual fund not found")
    return fund

@router.get("/funds/screener")
def screen_funds(
    category: str = "All",
    amc: str = "All",
    risk: str = "All",
    max_expense: float = 2.0,
    min_aum: float = 0.0
):
    """Query mutual funds using advanced parameter filters."""
    return MutualFundService.screen_funds(
        category=category,
        amc=amc,
        risk=risk,
        max_expense=max_expense,
        min_aum=min_aum
    )

@router.get("/funds/compare")
def compare_funds(ids: str):
    """Compare multiple mutual funds side-by-side."""
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    return MutualFundService.compare_funds(id_list)


# --- 18. Mutual Fund Watchlist Routers ---
@router.get("/funds/watchlist", response_model=List[schemas.FundWatchlistResponse])
def get_fund_watchlist(db: Session = Depends(get_db)):
    return db.query(models.FundWatchlistItem).all()

@router.post("/funds/watchlist", response_model=schemas.FundWatchlistResponse)
def add_fund_watchlist(req: schemas.FundWatchlistCreate, db: Session = Depends(get_db)):
    existing = db.query(models.FundWatchlistItem).filter(models.FundWatchlistItem.fund_id == req.fund_id.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Fund is already watchlisted")
    
    db_item = models.FundWatchlistItem(
        fund_id=req.fund_id.lower(),
        name=req.name,
        category=req.category,
        notes=req.notes,
        alert_nav=req.alert_nav,
        sip_reminder_day=req.sip_reminder_day,
        added_at=datetime.utcnow().strftime("%Y-%m-%d")
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/funds/watchlist/{id}")
def remove_fund_watchlist(id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.FundWatchlistItem).filter(models.FundWatchlistItem.id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    db.delete(db_item)
    db.commit()
    return {"status": "removed"}


# --- 19. User Asset Portfolio Holdings Routers ---
@router.get("/portfolio/holdings", response_model=List[schemas.HoldingResponse])
def get_portfolio_holdings(db: Session = Depends(get_db)):
    return db.query(models.UserHolding).all()

@router.post("/portfolio/holdings", response_model=schemas.HoldingResponse)
def add_portfolio_holding(req: schemas.HoldingCreate, db: Session = Depends(get_db)):
    db_holding = models.UserHolding(
        asset_class=req.asset_class,
        symbol=req.symbol.upper(),
        name=req.name,
        quantity=req.quantity,
        buy_price=req.buy_price,
        current_value=req.current_value,
        sector=req.sector,
        country=req.country,
        cagr=req.cagr,
        volatility=req.volatility
    )
    db.add(db_holding)
    db.commit()
    db.refresh(db_holding)
    return db_holding

@router.delete("/portfolio/holdings/{id}")
def remove_portfolio_holding(id: int, db: Session = Depends(get_db)):
    db_holding = db.query(models.UserHolding).filter(models.UserHolding.id == id).first()
    if not db_holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    db.delete(db_holding)
    db.commit()
    return {"status": "removed"}

