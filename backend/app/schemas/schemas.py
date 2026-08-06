from pydantic import BaseModel, ConfigDict
from typing import List, Optional

# Stock schemas
class StockBase(BaseModel):
    ticker: str
    name: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    market_cap: Optional[float] = None
    price: Optional[float] = None

class StockResponse(StockBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Filing schemas
class FilingBase(BaseModel):
    year: int
    type: str
    section_name: str
    content: str
    page_number: Optional[int] = None

class FilingResponse(FilingBase):
    id: int
    stock_id: int
    model_config = ConfigDict(from_attributes=True)

# Bookmark schemas
class BookmarkCreate(BaseModel):
    ticker: str
    type: str
    title: str
    url: Optional[str] = None

class BookmarkResponse(BaseModel):
    id: int
    ticker: str
    type: str
    title: str
    url: Optional[str] = None
    created_at: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Educational schemas
class Lesson(BaseModel):
    title: str
    slug: str
    category: str
    content: str
    level: str
    quiz_questions: List[dict]

class ProgressResponse(BaseModel):
    lesson_slug: str
    completed: bool
    model_config = ConfigDict(from_attributes=True)

class ProgressCompleteRequest(BaseModel):
    lesson_slug: str
    completed: bool

# Valuation Engine schemas
class DCFRequest(BaseModel):
    growth_rate_stage1: float # e.g. 8.0 for 8%
    growth_rate_stage2: float # e.g. 5.0
    discount_rate: float      # e.g. 10.0
    terminal_growth_rate: float # e.g. 2.5
    projection_years: int     # e.g. 5 or 10

class DCFSensitivityCell(BaseModel):
    discount_rate: float
    growth_rate: float
    intrinsic_value: float

class DCFResponse(BaseModel):
    ticker: str
    name: str
    current_price: float
    fcf_base: float
    projected_fcfs: List[float]
    terminal_value: float
    present_value_fcfs: float
    present_value_terminal: float
    enterprise_value: float
    intrinsic_value: float
    intrinsic_bull: Optional[float] = None
    intrinsic_bear: Optional[float] = None
    reverse_dcf_implied_growth: Optional[float] = None
    ddm_intrinsic_value: Optional[float] = None
    residual_income_value: Optional[float] = None
    ev_ebitda_value: Optional[float] = None
    ev_sales_value: Optional[float] = None
    peg_multiple_value: Optional[float] = None
    margin_of_safety: float
    is_undervalued: bool
    sensitivity_matrix: List[DCFSensitivityCell]
    calculations_log: str

# Portfolio Management schemas
class PortfolioAssetAllocation(BaseModel):
    asset_class: str
    percentage: float
    reasoning: str

class PortfolioRequest(BaseModel):
    age: int
    income: float
    savings: float
    existing_investments: Optional[str] = None
    risk_tolerance: str # Conservative, Moderate, Aggressive
    horizon: int
    goals: str

class PortfolioResponse(BaseModel):
    asset_allocation: List[PortfolioAssetAllocation]
    sector_allocation: List[dict] # {sector: str, percentage: float, explanation: str}
    correlation_matrix: List[List[float]] # Matrix of assets correlation
    correlation_assets: List[str] # List of asset names for matrix
    diversification_score: float # 1 to 10
    risk_contribution: List[dict] # {asset: str, percentage: float}
    expected_volatility: str
    stress_test_scenarios: List[dict] # {scenario: str, expected_return: str, description: str}
    rebalancing_suggestions: List[str]
    disclaimer: str

# Technical Analysis schemas
class TechnicalResponse(BaseModel):
    trend: str
    support_levels: List[float]
    resistance_levels: List[float]
    demand_zones: List[str]
    supply_zones: List[str]
    patterns_detected: List[str]
    indicators: dict
    bull_scenario: str
    bear_scenario: str
    neutral_scenario: str
    confirmation_levels: List[float]
    invalidation_levels: List[float]
    risk_factors: List[str]
    probability_estimates: str

# Trading Strategy schemas
class BacktestRequest(BaseModel):
    name: str
    indicators: List[str]
    stop_loss_pct: float
    take_profit_pct: float
    entry_rules: str
    exit_rules: str
    risk_rules: str
    position_sizing: str

class BacktestResponse(BaseModel):
    name: str
    win_rate: float
    sharpe_ratio: float
    max_drawdown: float
    profit_factor: float
    expectancy: float
    pine_script: str
    python_code: str
    walk_forward_metrics: dict
    monte_carlo_traces: List[List[float]]

# News and Sentiment schemas
class NewsSentimentResponse(BaseModel):
    fear_greed_score: float
    fear_greed_label: str
    score_explanations: List[str]
    positive_news: List[dict]
    negative_news: List[dict]
    neutral_news: List[dict]

# AI Copilot schemas
class ChatRequest(BaseModel):
    message: str
    ticker: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    citations: List[dict]

# Watchlist schemas
class WatchlistCreate(BaseModel):
    ticker: str
    name: Optional[str] = None
    sector: Optional[str] = None
    target_price: Optional[float] = None
    alert_threshold_pct: Optional[float] = None
    notes: Optional[str] = None

class WatchlistResponse(BaseModel):
    id: int
    ticker: str
    name: Optional[str] = None
    sector: Optional[str] = None
    target_price: Optional[float] = None
    alert_threshold_pct: Optional[float] = None
    notes: Optional[str] = None
    added_at: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class WatchlistUpdate(BaseModel):
    target_price: Optional[float] = None
    alert_threshold_pct: Optional[float] = None
    notes: Optional[str] = None

# Research Journal schemas
class JournalCreate(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    status: Optional[str] = "Active"          # Active, Watching, Exited, Closed
    investment_thesis: Optional[str] = None
    bull_case: Optional[str] = None
    base_case: Optional[str] = None
    bear_case: Optional[str] = None
    expected_cagr: Optional[float] = None
    entry_price: Optional[float] = None
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    risks: Optional[str] = None
    catalysts: Optional[str] = None
    conviction_score: Optional[int] = 5
    holding_period: Optional[str] = None
    actual_outcome: Optional[str] = None
    lessons_learned: Optional[str] = None

class JournalUpdate(BaseModel):
    status: Optional[str] = None
    investment_thesis: Optional[str] = None
    bull_case: Optional[str] = None
    base_case: Optional[str] = None
    bear_case: Optional[str] = None
    expected_cagr: Optional[float] = None
    entry_price: Optional[float] = None
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    risks: Optional[str] = None
    catalysts: Optional[str] = None
    conviction_score: Optional[int] = None
    holding_period: Optional[str] = None
    actual_outcome: Optional[str] = None
    lessons_learned: Optional[str] = None

class JournalResponse(BaseModel):
    id: int
    ticker: str
    company_name: Optional[str] = None
    idea_date: Optional[str] = None
    status: Optional[str] = None
    investment_thesis: Optional[str] = None
    bull_case: Optional[str] = None
    base_case: Optional[str] = None
    bear_case: Optional[str] = None
    expected_cagr: Optional[float] = None
    entry_price: Optional[float] = None
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    risks: Optional[str] = None
    catalysts: Optional[str] = None
    conviction_score: Optional[int] = None
    holding_period: Optional[str] = None
    actual_outcome: Optional[str] = None
    lessons_learned: Optional[str] = None
    last_updated: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# User Holdings schemas
class HoldingCreate(BaseModel):
    asset_class: str # Stock, Mutual Fund, ETF, Gold, Fixed Deposit, PPF, EPF, NPS, Bond, Cash
    symbol: str
    name: str
    quantity: float
    buy_price: float
    current_value: float
    sector: Optional[str] = None
    country: Optional[str] = "India"
    cagr: Optional[float] = 12.0
    volatility: Optional[float] = 15.0

class HoldingResponse(BaseModel):
    id: int
    asset_class: str
    symbol: str
    name: str
    quantity: float
    buy_price: float
    current_value: float
    sector: Optional[str] = None
    country: str
    cagr: float
    volatility: float
    model_config = ConfigDict(from_attributes=True)

# Mutual Fund Watchlist schemas
class FundWatchlistCreate(BaseModel):
    fund_id: str
    name: str
    category: Optional[str] = None
    notes: Optional[str] = None
    alert_nav: Optional[float] = None
    sip_reminder_day: Optional[int] = None

class FundWatchlistResponse(BaseModel):
    id: int
    fund_id: str
    name: str
    category: Optional[str] = None
    notes: Optional[str] = None
    alert_nav: Optional[float] = None
    sip_reminder_day: Optional[int] = None
    added_at: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
