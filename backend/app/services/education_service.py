from typing import List, Dict, Any, Optional

ACADEMY_LESSONS = [
    {
        "title": "Understanding the Price-to-Earnings (P/E) Ratio",
        "slug": "pe-ratio",
        "category": "Financial Statements",
        "level": "Beginner",
        "content": "The Price-to-Earnings (P/E) ratio is the most widely used valuation metric. It compares a company's current stock price to its Earnings Per Share (EPS). Formula: P/E = Stock Price / EPS. If a stock trades at $100 and EPS is $5, its P/E is 20x. This means investors are paying $20 for every $1 of annual earnings.",
        "example": "Company A trades at $150 with EPS of $10 (P/E = 15x). Company B trades at $150 with EPS of $5 (P/E = 30x). Assuming similar sectors, Company A is cheaper relative to its generated profits.",
        "summary": "P/E helps gauge if a stock is overvalued or undervalued relative to peers. A high P/E implies high growth expectations, while a low P/E might signal undervaluation or structural issues.",
        "quiz_questions": [
            {
                "question": "What is the formula for the Price-to-Earnings (P/E) ratio?",
                "options": [
                    "P/E = Market Cap / Net Profit",
                    "P/E = Stock Price / Earnings Per Share (EPS)",
                    "P/E = EBITDA / Total Assets",
                    "P/E = Dividend / Stock Price"
                ],
                "correct_index": 1,
                "explanation": "P/E matches the stock price per unit of generated earnings per share."
            },
            {
                "question": "A high P/E ratio relative to peers generally implies:",
                "options": [
                    "The stock is definitely a buy",
                    "The company has high debt",
                    "Investors expect high growth in the future",
                    "The company has poor profit margins"
                ],
                "correct_index": 2,
                "explanation": "High growth expectations justify paying a higher multiple today."
            }
        ]
    },
    {
        "title": "Unpacking Return on Capital Employed (ROCE)",
        "slug": "roce",
        "category": "Financial Statements",
        "level": "Intermediate",
        "content": "Return on Capital Employed (ROCE) is a capital efficiency ratio. It measures how profitably a company allocates capital (both equity and debt). Formula: ROCE = EBIT / (Total Assets - Current Liabilities). A ROCE above 15% is generally considered high, indicating strong capital allocation quality.",
        "example": "Company A earns $15 EBIT on $100 capital (ROCE = 15%). Company B earns $15 EBIT on $50 capital (ROCE = 30%). Company B generates twice the return on capital deployed, reflecting a more capital-efficient business model.",
        "summary": "ROCE measures capital allocation quality. It is especially useful for comparing capital-intensive businesses like manufacturing or utilities.",
        "quiz_questions": [
            {
                "question": "Which of the following is in the denominator of ROCE?",
                "options": [
                    "Stockholders Equity only",
                    "Total Liabilities only",
                    "Capital Employed (Equity + Debt)",
                    "Current Assets only"
                ],
                "correct_index": 2,
                "explanation": "ROCE includes all capital inputs, both equity and long-term borrowing."
            }
        ]
    },
    {
        "title": "Inflation & Interest Rates: Macro Mechanics",
        "slug": "macro-inflation",
        "category": "Macroeconomics",
        "level": "Professional",
        "content": "Inflation represents the rate at which general prices for goods rise, eroding purchasing power. Central banks control inflation by raising interest rates (repo rates). When rates rise, borrowing becomes expensive, slowing spending and cooling economic growth, which shifts capital from stocks into bonds.",
        "example": "In response to rising inflation, the Federal Reserve raised rates from 0.25% to 5.25%. Mortgage rates surged, cooling housing starts and shifting valuations downward in long-duration tech sectors.",
        "summary": "Rising interest rates cool economic activity and compress equity multiples, while falling rates expand liquidity and boost valuations.",
        "quiz_questions": [
            {
                "question": "How do central banks typically respond to high inflation?",
                "options": [
                    "By cutting repo interest rates",
                    "By printing more money",
                    "By raising policy interest rates",
                    "By freezing asset allocations"
                ],
                "correct_index": 2,
                "explanation": "Raising policy rates increases borrowing costs, cooling demand and inflation."
            }
        ]
    }
]

class EducationService:
    @staticmethod
    def get_all_lessons(level: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Returns educational academy lessons, optionally filtered by level.
        """
        if level:
            level_lower = level.lower().strip()
            return [l for l in ACADEMY_LESSONS if l["level"].lower() == level_lower]
        return ACADEMY_LESSONS

    @staticmethod
    def get_lesson_by_slug(slug: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a specific lesson by its unique slug identifier.
        """
        for l in ACADEMY_LESSONS:
            if l["slug"] == slug:
                return l
        return None
