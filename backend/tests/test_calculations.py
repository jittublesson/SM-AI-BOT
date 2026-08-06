import pytest
from app.services.valuation_service import ValuationService
from app.services.portfolio_service import PortfolioService
from app.services.strategy_service import StrategyService

def test_dcf_calculator():
    # Run multi-stage DCF on Apple mock profile
    res = ValuationService.calculate_dcf(
        ticker="AAPL",
        growth_rate_stage1=10.0,
        growth_rate_stage2=6.0,
        discount_rate=9.0,
        terminal_growth_rate=2.5,
        projection_years=5
    )
    
    assert res["ticker"] == "AAPL"
    assert res["intrinsic_value"] > 0
    assert "calculations_log" in res
    assert len(res["sensitivity_matrix"]) > 0

def test_portfolio_advice():
    # Run profiling advice for an Aggressive investor
    res = PortfolioService.get_portfolio_advice(
        age=30,
        income=1500000.0,
        savings=50000.0,
        risk_tolerance="Aggressive",
        horizon=10,
        goals="Retirement funding"
    )
    
    # Assert aggressive allocations are set
    equity_alloc = next(a for a in res["asset_allocation"] if a["asset_class"] == "Equity")
    assert equity_alloc["percentage"] == 75.0
    assert res["diversification_score"] == 8.5
    assert len(res["correlation_matrix"]) == 5

def test_strategy_backtester():
    # Run backtest for technical indicators
    res = StrategyService.generate_strategy_and_backtest(
        ticker="AAPL",
        indicators=["EMA 20", "SMA 50"],
        stop_loss_pct=2.0,
        take_profit_pct=6.0,
        entry_rules="Cross",
        exit_rules="Cross",
        risk_rules="ATR",
        position_sizing="1%"
    )
    
    assert "custom strategy" in res["name"]
    assert res["win_rate"] >= 0 and res["win_rate"] <= 100
    assert res["sharpe_ratio"] is not None
    assert len(res["monte_carlo_traces"]) == 30
