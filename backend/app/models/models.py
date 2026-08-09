from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    sector = Column(String, index=True)
    industry = Column(String)
    description = Column(Text)
    market_cap = Column(Float)
    price = Column(Float)

    filings = relationship("FilingDocument", back_populates="stock", cascade="all, delete-orphan")

class FilingDocument(Base):
    __tablename__ = "filings"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    type = Column(String) # e.g. "Annual Report", "Quarterly Report", "Earnings Call Transcript"
    section_name = Column(String, index=True) # e.g. "Chairman's Letter", "Risk Factors"
    content = Column(Text)
    page_number = Column(Integer)

    stock = relationship("Stock", back_populates="filings")

class UserBookmark(Base):
    __tablename__ = "user_bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    type = Column(String) # "stock", "report", "lesson"
    title = Column(String)
    url = Column(String)
    created_at = Column(String)

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String) # "Beginner", "Intermediate", "Professional"
    lesson_slug = Column(String, unique=True, index=True)
    completed = Column(Boolean, default=False)

class BacktestRecord(Base):
    __tablename__ = "backtest_records"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    win_rate = Column(Float)
    sharpe_ratio = Column(Float)
    max_drawdown = Column(Float)
    profit_factor = Column(Float)
    expectancy = Column(Float)
    pine_script = Column(Text)
    python_code = Column(Text)
    rules = Column(Text) # JSON serialized entry/exit/risk rules
    params = Column(Text) # JSON serialized parameters

class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True, nullable=False)
    name = Column(String)
    sector = Column(String)
    target_price = Column(Float, nullable=True)     # Alert target price
    alert_threshold_pct = Column(Float, nullable=True) # % move alert threshold
    notes = Column(Text, nullable=True)             # Short investor note
    added_at = Column(String)                       # ISO date string

class ResearchJournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True, nullable=False)
    company_name = Column(String)
    idea_date = Column(String)                      # ISO date string when idea was created
    status = Column(String, default="Active")       # Active, Exited, Watching, Closed
    investment_thesis = Column(Text)
    bull_case = Column(Text)
    base_case = Column(Text)
    bear_case = Column(Text)
    expected_cagr = Column(Float, nullable=True)    # Expected CAGR %
    entry_price = Column(Float, nullable=True)      # Price when idea was formed
    target_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    risks = Column(Text)                            # Comma-separated or paragraph
    catalysts = Column(Text)                        # Key upcoming events
    conviction_score = Column(Integer, default=5)   # 1-10
    holding_period = Column(String)                 # e.g. "12-18 months"
    actual_outcome = Column(Text, nullable=True)    # Post-investment review
    lessons_learned = Column(Text, nullable=True)
    last_updated = Column(String)                   # ISO date string

class UserHolding(Base):
    __tablename__ = "user_holdings"

    id = Column(Integer, primary_key=True, index=True)
    asset_class = Column(String, nullable=False) # Stock, Mutual Fund, ETF, Gold, Fixed Deposit, PPF, EPF, NPS, Bond, Cash
    symbol = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    quantity = Column(Float, default=1.0)
    buy_price = Column(Float, default=0.0)
    current_value = Column(Float, default=0.0)
    sector = Column(String, nullable=True)
    country = Column(String, default="India")
    cagr = Column(Float, default=12.0)
    volatility = Column(Float, default=15.0)

class FundWatchlistItem(Base):
    __tablename__ = "fund_watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    fund_id = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    alert_nav = Column(Float, nullable=True)
    sip_reminder_day = Column(Integer, nullable=True)
    added_at = Column(String)


class DataHealthReport(Base):
    __tablename__ = "data_health_reports"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True, nullable=False)
    name = Column(String, nullable=True)
    last_price_fetch = Column(String) # ISO timestamp
    last_financials_fetch = Column(String) # ISO timestamp
    last_financials_period = Column(String) # e.g. "FY2025-26"
    basis = Column(String) # e.g. "Consolidated"
    price = Column(Float)
    fetched_mcap_cr = Column(Float)
    ground_truth_mcap_cr = Column(Float)
    mcap_variance_pct = Column(Float)
    fetched_promoter = Column(Float)
    ground_truth_promoter = Column(Float)
    promoter_variance = Column(Float)
    status = Column(String) # "PASS" or "FAIL"
    error_message = Column(Text, nullable=True)
    checked_at = Column(String) # ISO timestamp of check execution
