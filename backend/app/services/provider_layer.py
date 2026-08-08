from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime
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

    @abstractmethod
    def getQuote(self, ticker: str) -> Dict[str, Any]:
        """Exposes live quote (price, intraday_change, volume, currency, timestamp)"""
        pass

    @abstractmethod
    def getIndices(self) -> List[Dict[str, Any]]:
        """Exposes major indices (Nifty, Sensex, Bank Nifty, India VIX) with as_of dates"""
        pass

    @abstractmethod
    def getFinancials(self, ticker: str) -> Dict[str, Any]:
        """Exposes multi-year financial statements"""
        pass

    @abstractmethod
    def getShareholding(self, ticker: str) -> Dict[str, Any]:
        """Exposes validated/normalized shareholding pattern summing to 100%"""
        pass

    @abstractmethod
    def getMarketBreadth(self) -> Dict[str, Any]:
        """Exposes market breadth (advances/declines)"""
        pass

    @abstractmethod
    def getFIIDIIFlows(self) -> Dict[str, Any]:
        """Exposes FII/DII flow statistics"""
        pass

    @abstractmethod
    def getNews(self, ticker: Optional[str] = None) -> Dict[str, Any]:
        """Exposes news feeds and calculated sentiment/fear_greed indicators"""
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

    def getQuote(self, ticker: str) -> Dict[str, Any]:
        data = YFinanceService.get_stock_data(ticker)
        if data.get("error_state"):
            return {"status": "unavailable"}
        info = data.get("info", {})
        return {
            "status": "available",
            "price": info.get("price"),
            "change": info.get("intraday_change"),
            "volume": info.get("volume"),
            "currency": info.get("currency"),
            "as_of": data.get("metadata", {}).get("last_updated")
        }

    def getIndices(self) -> List[Dict[str, Any]]:
        from app.services.macro_service import MacroService
        nifty = MacroService.get_index_price("^NSEI")
        sensex = MacroService.get_index_price("^BSESN")
        bank_nifty = MacroService.get_index_price("^NSEBANK")
        india_vix = MacroService.get_index_price("^INDIAVIX")
        
        return [
            {"name": "Nifty 50", **nifty},
            {"name": "Sensex", **sensex},
            {"name": "Bank Nifty", **bank_nifty},
            {"name": "India VIX", **india_vix}
        ]

    def getFinancials(self, ticker: str) -> Dict[str, Any]:
        data = YFinanceService.get_stock_data(ticker)
        if data.get("error_state"):
            return {"status": "unavailable"}
        return {
            "status": "available",
            "financials": data.get("financials", []),
            "metadata": data.get("metadata", {})
        }

    def getShareholding(self, ticker: str) -> Dict[str, Any]:
        data = YFinanceService.get_stock_data(ticker)
        if data.get("error_state"):
            return {"status": "unavailable"}
        info = data.get("info", {})
        detail = info.get("shareholding_detail", {})
        return {
            "status": "available",
            "promoter": detail.get("promoter", 0.0),
            "fii": detail.get("fii", 0.0),
            "dii": detail.get("dii", 0.0),
            "mutual_funds": detail.get("mutual_funds", 0.0),
            "insurance": detail.get("insurance", 0.0),
            "retail": detail.get("retail", 0.0),
            "foreign_investors": detail.get("foreign_investors", 0.0),
            "accumulation_signal": detail.get("accumulation_signal", "Neutral"),
            "as_of": data.get("metadata", {}).get("last_updated")
        }

    def getMarketBreadth(self) -> Dict[str, Any]:
        return {
            "data_available": False,
            "note": "Real-time market breadth (advances/declines) requires NSE India API access.",
            "source": "NSE India"
        }

    def getFIIDIIFlows(self) -> Dict[str, Any]:
        return {
            "data_available": False,
            "fii_net_today_cr": "N/A",
            "dii_net_today_cr": "N/A",
            "combined_flow": "N/A",
            "note": "Real-time FII/DII flow data is currently unavailable on free tier.",
        }

    def getNews(self, ticker: Optional[str] = None) -> Dict[str, Any]:
        from app.services.news_service import NewsService
        return NewsService.get_market_sentiment(ticker)

# Provider registry and helper resolver
_ACTIVE_PROVIDER = YFinanceProvider()

def get_market_provider() -> MarketDataProvider:
    """
    Returns the active market data provider instance.
    Defines a simple central hook to swap providers application-wide.
    """
    return _ACTIVE_PROVIDER
