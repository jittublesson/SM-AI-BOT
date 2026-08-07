from abc import ABC, abstractmethod
from typing import Dict, Any, List
from app.services.yfinance_service import YFinanceService

class MarketDataProvider(ABC):
    """
    Abstract Base Class for Market Data Providers.
    Ensures a standardized interface so we can swap yfinance for official BSE/NSE feeds or broker APIs.
    """
    @abstractmethod
    def search_companies(self, query: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_stock_data(self, ticker: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_stock_prices_history(self, ticker: str) -> List[float]:
        pass

class YFinanceProvider(MarketDataProvider):
    """
    Concrete implementation of MarketDataProvider using Yahoo Finance (yfinance).
    Handles standard stock searches, historical close prices, and corporate profiles.
    """
    def search_companies(self, query: str) -> List[Dict[str, Any]]:
        return YFinanceService.search_companies(query)

    def get_stock_data(self, ticker: str) -> Dict[str, Any]:
        return YFinanceService.get_stock_data(ticker)

    def get_stock_prices_history(self, ticker: str) -> List[float]:
        return YFinanceService.get_stock_prices_history(ticker)

# Provider registry and helper resolver
_ACTIVE_PROVIDER = YFinanceProvider()

def get_market_provider() -> MarketDataProvider:
    """
    Returns the active market data provider instance.
    Defines a simple central hook to swap providers application-wide.
    """
    return _ACTIVE_PROVIDER
