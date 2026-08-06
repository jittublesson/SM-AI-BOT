from typing import Dict, Any, List

# Static high-fidelity Indian Mutual Funds database
MOCK_FUNDS: Dict[str, Dict[str, Any]] = {
    "sbi-bluechip": {
        "id": "sbi-bluechip",
        "name": "SBI Bluechip Fund",
        "amc": "SBI Mutual Fund",
        "category": "Large Cap",
        "nav": 85.45,
        "aum_crore": 43500.0,
        "expense_ratio_pct": 0.85,
        "exit_load": "1.0% if redeemed within 1 year, nil after",
        "fund_manager": "Sohini Andani",
        "launch_date": "2006-02-14",
        "risk_level": "Very High",
        "benchmark": "Nifty 50 TRI",
        "min_sip": 500.0,
        "min_lumpsum": 5000.0,
        "asset_allocation": [
            {"asset": "Equity", "percentage": 96.50},
            {"asset": "Cash & Cash Equivalents", "percentage": 3.50}
        ],
        "sector_allocation": [
            {"sector": "Financial Services", "percentage": 28.50},
            {"sector": "Information Technology", "percentage": 14.20},
            {"sector": "Automobile & Auto Components", "percentage": 9.80},
            {"sector": "Healthcare", "percentage": 8.50},
            {"sector": "Consumer Services", "percentage": 7.40}
        ],
        "top_holdings": [
            {"company": "HDFC Bank Ltd.", "percentage": 8.20},
            {"company": "ICICI Bank Ltd.", "percentage": 7.45},
            {"company": "Reliance Industries Ltd.", "percentage": 6.80},
            {"company": "Infosys Ltd.", "percentage": 5.40},
            {"company": "Larsen & Toubro Ltd.", "percentage": 4.50}
        ],
        "returns": {
            "1m": "2.4%", "3m": "6.8%", "6m": "11.2%", "1y": "22.5%", "3y": "15.8%", "5y": "16.9%", "10y": "14.2%", "inception": "15.5%"
        },
        "research": {
            "summary": "SBI Bluechip Fund is one of India's largest and most consistent large-cap schemes. It holds a robust portfolio focused on blue-chip market leaders with proven corporate governance and strong balance sheets.",
            "objective": "To provide investors with long-term capital growth opportunities from a diversified portfolio of active equities primarily in Large Cap companies.",
            "strategy": "Employs a bottom-up stock-picking framework with a safety margin bias, prioritizing structural sector growth candidates with defensive cash flows.",
            "risk_ratios": {
                "sharpe": 1.25, "sortino": 1.45, "alpha": 2.10, "beta": 0.92, "volatility": 12.8, "drawdown": "-14.2%"
            },
            "pros": [
                "Strong track record across market cycles.",
                "Lower downside volatility than the benchmark index.",
                "High liquidity AUM base managing transaction costs efficiently."
            ],
            "cons": [
                "Underperformance during aggressive mid/small-cap led bull rallies.",
                "Higher asset size limits flexibility in dynamic stock accumulation."
            ],
            "suitable_investors": "Investors seeking stable equity compounding, lower volatility profiles, and long-term retirement capital generation with a horizon of 5+ years.",
            "opinion": "ACCUMULATE. High quality core portfolio offering defensive cushion. Recommended as a cornerstone large-cap holding in domestic portfolios."
        }
    },
    "hdfc-midcap": {
        "id": "hdfc-midcap",
        "name": "HDFC Mid-Cap Opportunities Fund",
        "amc": "HDFC Mutual Fund",
        "category": "Mid Cap",
        "nav": 178.60,
        "aum_crore": 65200.0,
        "expense_ratio_pct": 0.78,
        "exit_load": "1.0% if redeemed within 1 year, nil after",
        "fund_manager": "Chirag Setalvad",
        "launch_date": "2007-06-25",
        "risk_level": "Very High",
        "benchmark": "Nifty Midcap 150 TRI",
        "min_sip": 100.0,
        "min_lumpsum": 5000.0,
        "asset_allocation": [
            {"asset": "Equity", "percentage": 94.80},
            {"asset": "Cash & Cash Equivalents", "percentage": 5.20}
        ],
        "sector_allocation": [
            {"sector": "Capital Goods", "percentage": 20.40},
            {"sector": "Financial Services", "percentage": 16.50},
            {"sector": "Information Technology", "percentage": 11.20},
            {"sector": "Chemicals", "percentage": 9.30},
            {"sector": "Automobile & Auto Components", "percentage": 8.40}
        ],
        "top_holdings": [
            {"company": "Tata Technologies Ltd.", "percentage": 4.80},
            {"company": "Federal Bank Ltd.", "percentage": 4.10},
            {"company": "Aurobindo Pharma Ltd.", "percentage": 3.80},
            {"company": "Indian Hotels Co. Ltd.", "percentage": 3.40},
            {"company": "Supreme Industries Ltd.", "percentage": 3.20}
        ],
        "returns": {
            "1m": "3.8%", "3m": "8.5%", "6m": "14.8%", "1y": "31.2%", "3y": "24.5%", "5y": "22.8%", "10y": "19.5%", "inception": "18.2%"
        },
        "research": {
            "summary": "HDFC Mid-Cap Opportunities Fund is the largest mid-cap fund in the country. It manages a massive asset base by spreading risks across a highly diversified list of mid-cap challengers.",
            "objective": "To generate long-term capital appreciation from a portfolio that is predominantly invested in mid-cap equity and equity-related instruments.",
            "strategy": "Combines growth at a reasonable price (GARP) with structural stock-picking, searching for companies with strong growth prospects and moderate debt structures.",
            "risk_ratios": {
                "sharpe": 1.58, "sortino": 1.85, "alpha": 4.50, "beta": 0.95, "volatility": 15.6, "drawdown": "-18.5%"
            },
            "pros": [
                "Exceptional long-term outperformance against peer schemes.",
                "Well-diversified portfolio reduces individual mid-cap drawdown exposure.",
                "Experienced fund manager leading since inception phases."
            ],
            "cons": [
                "Massive AUM size can restrict entry/exit options in micro-cap targets.",
                "Marginally higher cash holdings to manage sudden redemption spikes."
            ],
            "suitable_investors": "Investors seeking wealth creation with moderate risk thresholds, prepared for periodic mid-cap volatility curves, over a horizon of 7+ years.",
            "opinion": "BUY. Best-in-class mid-cap compounder displaying superior alpha generation over peer benchmarks."
        }
    },
    "nippon-smallcap": {
        "id": "nippon-smallcap",
        "name": "Nippon India Small Cap Fund",
        "amc": "Nippon India Mutual Fund",
        "category": "Small Cap",
        "nav": 165.20,
        "aum_crore": 51500.0,
        "expense_ratio_pct": 0.72,
        "exit_load": "1.0% if redeemed within 1 month, nil after",
        "fund_manager": "Samir Rachh",
        "launch_date": "2010-09-16",
        "risk_level": "Very High",
        "benchmark": "Nifty Smallcap 250 TRI",
        "min_sip": 100.0,
        "min_lumpsum": 5000.0,
        "asset_allocation": [
            {"asset": "Equity", "percentage": 95.80},
            {"asset": "Cash & Cash Equivalents", "percentage": 4.20}
        ],
        "sector_allocation": [
            {"sector": "Industrial Products", "percentage": 18.20},
            {"sector": "Financial Services", "percentage": 14.30},
            {"sector": "Consumer Discretionary", "percentage": 12.80},
            {"sector": "IT & Electronics", "percentage": 9.50},
            {"sector": "Chemicals", "percentage": 8.40}
        ],
        "top_holdings": [
            {"company": "Tube Investments of India Ltd.", "percentage": 3.80},
            {"company": "HDFC Bank Ltd.", "percentage": 3.10},
            {"company": "KPIT Technologies Ltd.", "percentage": 2.90},
            {"company": "Apar Industries Ltd.", "percentage": 2.55},
            {"company": "Karur Vysya Bank Ltd.", "percentage": 2.40}
        ],
        "returns": {
            "1m": "4.5%", "3m": "10.2%", "6m": "19.5%", "1y": "42.8%", "3y": "32.5%", "5y": "28.9%", "10y": "22.4%", "inception": "20.5%"
        },
        "research": {
            "summary": "Nippon India Small Cap Fund is a pioneer in small-cap investing, running a massive multi-cap basket strategy. It invests in a large list of 150+ small-cap equities to control extreme drawdowns.",
            "objective": "To generate consistent capital growth by investing predominantly in equity and equity-related securities of small-cap enterprises.",
            "strategy": "Aggressive bottom-up research, picking low-debt niche market leaders experiencing tailwinds from domestic manufacturing, capex cycles, and structural expansions.",
            "risk_ratios": {
                "sharpe": 1.82, "sortino": 2.15, "alpha": 6.20, "beta": 1.08, "volatility": 18.2, "drawdown": "-22.4%"
            },
            "pros": [
                "Incredible multi-year category leader in alpha creation.",
                "Granular diversification minimizes downside single-stock blowup risk.",
                "Participates aggressively in domestic manufacturing expansions."
            ],
            "cons": [
                "Highly volatile during general index corrections.",
                "Frequently limits fresh lumpsum entries to protect existing capital base."
            ],
            "suitable_investors": "Aggressive investors with high risk tolerances, looking for high alpha compounding, over a time frame of 10+ years.",
            "opinion": "ACCUMULATE IN DIPS. Outstanding track record of finding future mid-caps. SIP is highly recommended over lumpsum here."
        }
    },
    "pp-flexicap": {
        "id": "pp-flexicap",
        "name": "Parag Parikh Flexi Cap Fund",
        "amc": "PPFAS Mutual Fund",
        "category": "Flexi Cap",
        "nav": 92.40,
        "aum_crore": 62800.0,
        "expense_ratio_pct": 0.62,
        "exit_load": "2.0% if redeemed within 365 days, 1.0% between 365-730 days, nil after",
        "fund_manager": "Rajeev Thakkar",
        "launch_date": "2013-05-24",
        "risk_level": "Very High",
        "benchmark": "Nifty 500 TRI",
        "min_sip": 1000.0,
        "min_lumpsum": 1000.0,
        "asset_allocation": [
            {"asset": "Equity", "percentage": 88.50},
            {"asset": "International Equities", "percentage": 14.50},
            {"asset": "Debt & Liquid Units", "percentage": 6.50},
            {"asset": "Cash & Cash Equivalents", "percentage": 5.00}
        ],
        "sector_allocation": [
            {"sector": "Financial Services", "percentage": 24.50},
            {"sector": "Technology & Internet", "percentage": 19.80},
            {"sector": "Consumer Services", "percentage": 13.50},
            {"sector": "Automobiles", "percentage": 8.40},
            {"sector": "Healthcare", "percentage": 7.20}
        ],
        "top_holdings": [
            {"company": "HDFC Bank Ltd.", "percentage": 8.90},
            {"company": "Microsoft Corp. (US)", "percentage": 6.20},
            {"company": "Alphabet Inc. (US)", "percentage": 5.40},
            {"company": "ICICI Bank Ltd.", "percentage": 5.10},
            {"company": "ITC Ltd.", "percentage": 4.80}
        ],
        "returns": {
            "1m": "1.8%", "3m": "5.4%", "6m": "9.8%", "1y": "24.2%", "3y": "19.8%", "5y": "20.4%", "10y": "17.8%", "inception": "18.9%"
        },
        "research": {
            "summary": "Parag Parikh Flexi Cap Fund is highly unique due to its value-investing bias and inclusion of international US technology equities. It acts as a global asset allocation scheme under a single domestic taxation structure.",
            "objective": "To generate long-term capital growth from an actively managed portfolio of equity and equity-related securities of large, mid, and small-cap companies, including offshore stocks.",
            "strategy": "Disciplined value investing framework. Holds concentrated positions in strong cash-flowing companies and sits on cash when valuations are expensive.",
            "risk_ratios": {
                "sharpe": 1.62, "sortino": 1.98, "alpha": 3.80, "beta": 0.78, "volatility": 11.2, "drawdown": "-11.8%"
            },
            "pros": [
                "Offshore US diversification helps hedge INR currency depreciation.",
                "Conservative risk profile showing lowest category drawdowns.",
                "Consistent value picking avoiding expensive sector bubble traps."
            ],
            "cons": [
                "Regulatory limits on foreign outflows can restrict buying offshore opportunities.",
                "Slightly higher exit load penalty rules out short term allocation changes."
            ],
            "suitable_investors": "Investors seeking global diversification, conservative equity compounding, and stable value assets, with a horizon of 5+ years.",
            "opinion": "BUY (CONVICTION). Premier domestic flexi-cap scheme offering outstanding risk-adjusted performance profile."
        }
    },
    "mirae-elss": {
        "id": "mirae-elss",
        "name": "Mirae Asset Tax Saver Fund",
        "amc": "Mirae Asset Mutual Fund",
        "category": "ELSS (Tax Saver)",
        "nav": 42.15,
        "aum_crore": 22600.0,
        "expense_ratio_pct": 0.58,
        "exit_load": "Nil (3-Year Statutory Lock-in)",
        "fund_manager": "Neelesh Surana",
        "launch_date": "2015-12-28",
        "risk_level": "Very High",
        "benchmark": "Nifty 500 TRI",
        "min_sip": 500.0,
        "min_lumpsum": 500.0,
        "asset_allocation": [
            {"asset": "Equity", "percentage": 98.20},
            {"asset": "Cash & Cash Equivalents", "percentage": 1.80}
        ],
        "sector_allocation": [
            {"sector": "Financial Services", "percentage": 30.20},
            {"sector": "Information Technology", "percentage": 13.80},
            {"sector": "Energy & Power", "percentage": 10.40},
            {"sector": "Healthcare", "percentage": 8.90},
            {"sector": "Consumer Durables", "percentage": 7.50}
        ],
        "top_holdings": [
            {"company": "ICICI Bank Ltd.", "percentage": 8.50},
            {"company": "HDFC Bank Ltd.", "percentage": 7.90},
            {"company": "Reliance Industries Ltd.", "percentage": 6.20},
            {"company": "Infosys Ltd.", "percentage": 5.80},
            {"company": "Axis Bank Ltd.", "percentage": 4.10}
        ],
        "returns": {
            "1m": "2.2%", "3m": "6.2%", "6m": "10.8%", "1y": "23.4%", "3y": "16.5%", "5y": "17.9%", "10y": "—", "inception": "19.2%"
        },
        "research": {
            "summary": "Mirae Asset Tax Saver Fund is a premier ELSS fund offering Section 80C tax deduction benefits. It operates under a growth-style investment philosophy, managing a large-cap heavy portfolio.",
            "objective": "To generate long-term capital appreciation from a diversified portfolio of predominantly equity and equity-related instruments, offering tax benefits.",
            "strategy": "Growth-oriented bottom-up framework. Allocates a large portion to high-quality large-cap leaders, with tactical alpha picks in stable mid-cap candidates.",
            "risk_ratios": {
                "sharpe": 1.34, "sortino": 1.55, "alpha": 2.40, "beta": 0.94, "volatility": 13.1, "drawdown": "-13.5%"
            },
            "pros": [
                "Enables tax savings under Sec 80C of the Income Tax Act.",
                "Compulsory 3-year lock-in prevents emotional selling, improving long-term compounding.",
                "Highly stable downside protection due to a strong large-cap focus."
            ],
            "cons": [
                "No liquidity allowed for 3 years from each purchase date.",
                "Limited mid/small-cap allocation restricts maximum upside alpha expansion."
            ],
            "suitable_investors": "Salaried individuals looking for tax deduction options under Sec 80C, while compounding long-term capital in equity markets for 3+ years.",
            "opinion": "BUY. Excellent tax-planning asset with a superior risk-adjusted return history."
        }
    },
    "icici-liquid": {
        "id": "icici-liquid",
        "name": "ICICI Prudential Liquid Fund",
        "amc": "ICICI Prudential Mutual Fund",
        "category": "Liquid Funds",
        "nav": 365.40,
        "aum_crore": 48900.0,
        "expense_ratio_pct": 0.22,
        "exit_load": "0.0070% if redeemed within 1 day, nil after 7 days",
        "fund_manager": "Rahul Goswami",
        "launch_date": "2005-09-02",
        "risk_level": "Moderate",
        "benchmark": "Nifty Liquid Index A-I",
        "min_sip": 1000.0,
        "min_lumpsum": 5000.0,
        "asset_allocation": [
            {"asset": "Treasury Bills (T-Bills)", "percentage": 42.50},
            {"asset": "Commercial Paper (CP)", "percentage": 35.80},
            {"asset": "Certificate of Deposits (CD)", "percentage": 18.20},
            {"asset": "Cash & Cash Equivalents", "percentage": 3.50}
        ],
        "sector_allocation": [
            {"sector": "Sovereign Government Paper", "percentage": 42.50},
            {"sector": "Banking & Financial Services", "percentage": 38.50},
            {"sector": "Infrastructure & Utilities", "percentage": 10.20},
            {"sector": "Conglomerates", "percentage": 8.80}
        ],
        "top_holdings": [
            {"company": "364 Days T-Bill (Govt)", "percentage": 12.50},
            {"company": "182 Days T-Bill (Govt)", "percentage": 10.80},
            {"company": "HDFC Bank CP", "percentage": 6.80},
            {"company": "NABARD CD", "percentage": 5.40},
            {"company": "SIDBI CD", "percentage": 4.80}
        ],
        "returns": {
            "1m": "0.55%", "3m": "1.72%", "6m": "3.48%", "1y": "7.15%", "3y": "6.22%", "5y": "5.45%", "10y": "6.35%", "inception": "7.24%"
        },
        "research": {
            "summary": "ICICI Prudential Liquid Fund is a highly secure liquid scheme focusing on short term debt instruments with maturities under 91 days. It is used as a temporary storage or STP source fund.",
            "objective": "To provide reasonable returns with high liquidity and capital preservation by investing in low-risk debt and money market instruments.",
            "strategy": "Prioritizes credit rating safety and low duration to protect capital from interest rate fluctuations and credit default risks.",
            "risk_ratios": {
                "sharpe": 2.45, "sortino": 3.12, "alpha": 0.45, "beta": 0.05, "volatility": 0.45, "drawdown": "0.0%"
            },
            "pros": [
                "Virtually zero capital loss risk.",
                "Redemptions credited within 24 hours (instant access).",
                "High quality sovereign and AAA-rated asset portfolio."
            ],
            "cons": [
                "Inflation-negative returns during rate-cutting cycles.",
                "Low returns compared to equity assets."
            ],
            "suitable_investors": "Investors seeking an emergency fund vault, parking cash for STP, or storing short-term capital.",
            "opinion": "ACCUMULATE. Best-in-class parking vault for immediate portfolio liquidity needs."
        }
    },
    "sbi-hybrid": {
        "id": "sbi-hybrid",
        "name": "SBI Equity Hybrid Fund",
        "amc": "SBI Mutual Fund",
        "category": "Hybrid Funds",
        "nav": 245.50,
        "aum_crore": 62100.0,
        "expense_ratio_pct": 0.74,
        "exit_load": "1.0% if redeemed within 1 year, nil after",
        "fund_manager": "Rajeev Radhakrishnan",
        "launch_date": "1995-10-08",
        "risk_level": "Very High",
        "benchmark": "CRISIL Hybrid 35+65 Aggressive Index",
        "min_sip": 500.0,
        "min_lumpsum": 1000.0,
        "asset_allocation": [
            {"asset": "Equity", "percentage": 72.40},
            {"asset": "Government Securities (G-Sec)", "percentage": 18.50},
            {"asset": "Corporate Bonds", "percentage": 6.80},
            {"asset": "Cash & Cash Equivalents", "percentage": 2.30}
        ],
        "sector_allocation": [
            {"sector": "Financial Services", "percentage": 20.40},
            {"sector": "Sovereign Debt", "percentage": 18.50},
            {"sector": "Information Technology", "percentage": 11.80},
            {"sector": "Consumer Services", "percentage": 9.40},
            {"sector": "Automobiles", "percentage": 7.20}
        ],
        "top_holdings": [
            {"company": "7.18% G-Sec 2033 (Govt)", "percentage": 9.40},
            {"company": "ICICI Bank Ltd. (Equity)", "percentage": 6.20},
            {"company": "HDFC Bank Ltd. (Equity)", "percentage": 5.80},
            {"company": "Infosys Ltd. (Equity)", "percentage": 4.50},
            {"company": "REC Ltd. NCDs (Bond)", "percentage": 3.20}
        ],
        "returns": {
            "1m": "1.65%", "3m": "4.82%", "6m": "8.45%", "1y": "18.15%", "3y": "12.22%", "5y": "13.45%", "10y": "12.85%", "inception": "14.50%"
        },
        "research": {
            "summary": "SBI Equity Hybrid Fund is a legacy hybrid allocation scheme. It keeps around 70-75% in equity for growth and 25-30% in high-grade debt to provide cushioning during market drops.",
            "objective": "To provide long-term capital compounding and regular income by investing in a mix of active equity and high-grade debt instruments.",
            "strategy": "Rebalances dynamically. Trims equity exposure during peak valuations and purchases bonds to control drawdowns.",
            "risk_ratios": {
                "sharpe": 1.18, "sortino": 1.35, "alpha": 1.85, "beta": 0.72, "volatility": 9.4, "drawdown": "-9.8%"
            },
            "pros": [
                "Automatic dynamic asset rebalancing controls volatility.",
                "Equity taxation applies as equity holdings exceed 65% on average.",
                "Lower drawdowns during index bears."
            ],
            "cons": [
                "Will underperform pure equity funds during strong market expansions.",
                "Expense ratio is slightly high for bond management parts."
            ],
            "suitable_investors": "Conservative investors or retirement-focused accounts looking for equity growth without extreme volatility, over 3+ years.",
            "opinion": "BUY. Safe entry point for equity exposure with built-in asset allocation shield."
        }
    },
    "hdfc-gold": {
        "id": "hdfc-gold",
        "name": "HDFC Gold Fund",
        "amc": "HDFC Mutual Fund",
        "category": "Gold Funds",
        "nav": 24.50,
        "aum_crore": 4200.0,
        "expense_ratio_pct": 0.45,
        "exit_load": "1.0% if redeemed within 15 days, nil after",
        "fund_manager": "Nirman Morakhia",
        "launch_date": "2011-11-01",
        "risk_level": "High",
        "benchmark": "Domestic Price of Gold",
        "min_sip": 100.0,
        "min_lumpsum": 5000.0,
        "asset_allocation": [
            {"asset": "Gold ETF Units (HDFC Gold ETF)", "percentage": 99.40},
            {"asset": "Cash & Cash Equivalents", "percentage": 0.60}
        ],
        "sector_allocation": [
            {"sector": "Precious Metals", "percentage": 99.40},
            {"sector": "Liquid Reserves", "percentage": 0.60}
        ],
        "top_holdings": [
            {"company": "HDFC Gold ETF", "percentage": 99.40},
            {"company": "Cash & Call Money", "percentage": 0.60}
        ],
        "returns": {
            "1m": "1.20%", "3m": "3.50%", "6m": "8.20%", "1y": "15.40%", "3y": "11.20%", "5y": "12.10%", "10y": "9.80%", "inception": "9.50%"
        },
        "research": {
            "summary": "HDFC Gold Fund is a Fund of Funds (FoF) investing directly in units of HDFC Gold ETF. It allows investors to buy paper gold in SIP form without needing a demat account.",
            "objective": "To generate capital growth corresponding to the returns generated by precious metals over a long duration.",
            "strategy": "Passively tracks the domestic spot price of physical gold by purchasing liquid units of the underlying gold exchange traded fund.",
            "risk_ratios": {
                "sharpe": 0.85, "sortino": 1.05, "alpha": 0.05, "beta": 0.99, "volatility": 10.4, "drawdown": "-8.5%"
            },
            "pros": [
                "Enables automated SIP investments into gold.",
                "Zero physical storage risk or purity concerns.",
                "Excellent inflation hedge during macroeconomic crises."
            ],
            "cons": [
                "Underperforms during general stock market expansions.",
                "No dividend distribution; returns are purely capital price changes."
            ],
            "suitable_investors": "Investors seeking geopolitical hedge diversification and long-term asset security, keeping gold as 5-10% of their net worth.",
            "opinion": "ACCUMULATE. Crucial diversifier that hedges equity valuation risks."
        }
    },
    "motilal-nasdaq": {
        "id": "motilal-nasdaq",
        "name": "Motilal Oswal Nasdaq 100 FOF",
        "amc": "Motilal Oswal Mutual Fund",
        "category": "International Funds",
        "nav": 34.20,
        "aum_crore": 6800.0,
        "expense_ratio_pct": 0.50,
        "exit_load": "1.0% if redeemed within 3 months, nil after",
        "fund_manager": "Ankush Sood",
        "launch_date": "2018-11-28",
        "risk_level": "Very High",
        "benchmark": "NASDAQ-100 TRI (INR)",
        "min_sip": 500.0,
        "min_lumpsum": 500.0,
        "asset_allocation": [
            {"asset": "International ETF Units (MO Nasdaq 100 ETF)", "percentage": 98.80},
            {"asset": "Cash & Cash Equivalents", "percentage": 1.20}
        ],
        "sector_allocation": [
            {"sector": "Information Technology", "percentage": 48.50},
            {"sector": "Consumer Services", "percentage": 18.20},
            {"sector": "Consumer Discretionary", "percentage": 14.50},
            {"sector": "Healthcare", "percentage": 9.25},
            {"sector": "Industrials", "percentage": 4.80}
        ],
        "top_holdings": [
            {"company": "Motilal Oswal Nasdaq 100 ETF", "percentage": 98.80},
            {"company": "Cash & Call Reserves", "percentage": 1.20}
        ],
        "returns": {
            "1m": "2.8%", "3m": "7.5%", "6m": "12.4%", "1y": "28.5%", "3y": "18.2%", "5y": "21.5%", "10y": "—", "inception": "22.8%"
        },
        "research": {
            "summary": "Motilal Oswal Nasdaq 100 FOF is an international fund investing directly in Motilal Oswal Nasdaq 100 ETF. It exposes investors to the 100 largest US non-financial technology innovators.",
            "objective": "To seek long term capital appreciation by investing in units of the underlying NASDAQ 100 Exchange Traded Fund.",
            "strategy": "Passive indexing matching the tech heavy Nasdaq 100 growth giants, including Apple, Microsoft, NVIDIA, Amazon, and Meta.",
            "risk_ratios": {
                "sharpe": 1.42, "sortino": 1.72, "alpha": 2.85, "beta": 1.02, "volatility": 14.8, "drawdown": "-19.5%"
            },
            "pros": [
                "Direct exposure to world-class technological monopolies.",
                "Dual benefit from US equity growth and USD currency appreciation against INR.",
                "Simple SIP execution without global bank brokerage accounts."
            ],
            "cons": [
                "Subject to debt taxation rules for international funds in India.",
                "Subject to regulatory foreign remittance investment limits."
            ],
            "suitable_investors": "Growth-seeking investors wanting global technology exposure, willing to hold through USD tech correction cycles, over 5+ years.",
            "opinion": "BUY. Prime passive allocation asset offering unique global tech alpha exposure."
        }
    }
}

class MutualFundService:
    @staticmethod
    def get_all_funds() -> List[Dict[str, Any]]:
        return list(MOCK_FUNDS.values())

    @staticmethod
    def get_fund_by_id(fund_id: str) -> Dict[str, Any]:
        return MOCK_FUNDS.get(fund_id.lower().strip())

    @staticmethod
    def search_funds(query: str) -> List[Dict[str, Any]]:
        q = query.lower().strip()
        if not q:
            return []
        return [
            f for f in MOCK_FUNDS.values()
            if q in f["name"].lower() or q in f["amc"].lower() or q in f["category"].lower()
        ]

    @staticmethod
    def compare_funds(fund_ids: List[str]) -> List[Dict[str, Any]]:
        results = []
        for fid in fund_ids:
            fund = MOCK_FUNDS.get(fid.lower().strip())
            if fund:
                results.append(fund)
        return results

    @staticmethod
    def screen_funds(
        category: str = "All",
        amc: str = "All",
        risk: str = "All",
        max_expense: float = 2.0,
        min_aum: float = 0.0
    ) -> List[Dict[str, Any]]:
        results = list(MOCK_FUNDS.values())
        
        if category != "All":
            results = [f for f in results if f["category"].lower() == category.lower()]
            
        if amc != "All":
            results = [f for f in results if amc.lower() in f["amc"].lower()]
            
        if risk != "All":
            results = [f for f in results if f["risk_level"].lower() == risk.lower()]
            
        results = [f for f in results if f["expense_ratio_pct"] <= max_expense]
        results = [f for f in results if f["aum_crore"] >= min_aum]
        
        return results
