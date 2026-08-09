import logging

logger = logging.getLogger("wealthpilot.validation")
logging.basicConfig(level=logging.INFO)

def validate_shareholding_data(ticker: str, promoter: float, fii: float, dii: float, retail: float) -> bool:
    total = promoter + fii + dii + retail
    if not (99.5 <= total <= 100.5):
        logger.error(
            f"[VALIDATION ERROR] Shareholding percentages for ticker '{ticker}' sum to {total:.2f}%, "
            f"which is outside the required range of 99.5% - 100.5% (Promoter: {promoter}%, FII: {fii}%, DII: {dii}%, Retail: {retail}%)."
        )
        return False
    logger.info(f"[VALIDATION SUCCESS] Shareholding sum for '{ticker}': {total:.2f}%")
    return True

def validate_financial_growth(ticker: str, year: int, line_item: str, yoy_change: float) -> bool:
    abs_change = abs(yoy_change)
    limit = 200.0 if "Revenue" in line_item else 1500.0
    if abs_change > limit:
        logger.error(
            f"[VALIDATION ERROR] Extreme YoY change detected for '{ticker}' {line_item} in {year}: {yoy_change:.2f}%. "
            f"This is highly indicative of a parsing or scaling bug."
        )
        return False
    elif abs_change > (limit * 0.25):
        logger.warning(
            f"[VALIDATION WARNING] Unusual YoY change detected for '{ticker}' {line_item} in {year}: {yoy_change:.2f}%."
        )
    return True

def validate_debt_equity_ratio(ticker: str, year: int, total_debt: float, shareholders_equity: float, reported_ratio: float) -> bool:
    if not shareholders_equity or shareholders_equity == 0:
        return True
    calculated_ratio = round(total_debt / shareholders_equity, 2)
    if abs(calculated_ratio - reported_ratio) > 0.02:
        logger.error(
            f"[VALIDATION ERROR] Debt-to-Equity ratio inconsistency for '{ticker}' in {year}: "
            f"Calculated: {calculated_ratio:.2f}x (Debt: {total_debt:.2f}, Equity: {shareholders_equity:.2f}), "
            f"but Reported: {reported_ratio:.2f}x. Check parsing."
        )
        return False
    return True
