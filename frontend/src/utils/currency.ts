// Currency Conversion and Formatting Engine for WealthPilot AI

export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,      // base
  INR: 83.50,    // 1 USD = 83.50 INR
  EUR: 0.92,     // 1 USD = 0.92 EUR
  GBP: 0.77,     // 1 USD = 0.77 GBP
  JPY: 155.0     // 1 USD = 155.0 JPY
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥"
};

/**
  * Converts an amount from one currency to another using absolute USD pegs.
  */
export function convertCurrency(value: number, from: string, to: string): number {
  const f = (from || "USD").toUpperCase();
  const t = (to || "USD").toUpperCase();
  
  const fromRate = EXCHANGE_RATES[f] || 1.0;
  const toRate = EXCHANGE_RATES[t] || 1.0;
  
  // Convert from source currency to USD, then from USD to target currency
  return (value / fromRate) * toRate;
}

/**
  * Formats integer/float values using the Indian grouping format (e.g. 12,34,56,789.00)
  */
export function formatIndianNumber(value: number): string {
  const sign = value < 0 ? "-" : "";
  const absValue = Math.abs(value);
  
  // round to two decimal places
  const parts = absValue.toFixed(2).split(".");
  let numStr = parts[0];
  const decStr = parts[1] === "00" ? "" : "." + parts[1];
  
  if (numStr.length > 3) {
    const lastThree = numStr.slice(-3);
    const remaining = numStr.slice(0, -3);
    const groupedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    numStr = groupedRemaining + "," + lastThree;
  }
  
  return sign + numStr + decStr;
}

/**
  * Formats a monetary value string with its currency symbol prefix.
  */
export function formatWithSymbol(valStr: string, currency: string): string {
  const c = (currency || "USD").toUpperCase();
  const symbol = CURRENCY_SYMBOLS[c] || c;
  
  if (["INR", "USD", "EUR", "GBP", "JPY"].includes(c)) {
    return symbol + valStr;
  }
  return valStr + " " + symbol;
}

/**
  * Formats a raw value compactly using either Indian (Lakh/Crore) or International formats.
  * @param absoluteValue Absolute dollar/rupee amount (e.g., 20,000,000,000,000)
  */
export function formatCompact(absoluteValue: number, targetCurrency: string): string {
  const absVal = Math.abs(absoluteValue);
  const sign = absoluteValue < 0 ? "-" : "";
  const c = (targetCurrency || "USD").toUpperCase();
  
  if (c === "INR") {
    // 1 Lakh Crore = 10^12
    if (absVal >= 1e12) {
      return sign + formatWithSymbol((absVal / 1e12).toFixed(2) + " Lakh Crore", "INR");
    }
    // 1 Crore = 10^7
    if (absVal >= 1e7) {
      return sign + formatWithSymbol((absVal / 1e7).toFixed(2) + " Crore", "INR");
    }
    // 1 Lakh = 10^5
    if (absVal >= 1e5) {
      return sign + formatWithSymbol((absVal / 1e5).toFixed(2) + " Lakh", "INR");
    }
    return sign + formatWithSymbol(formatIndianNumber(absVal), "INR");
  } else {
    // 1 Trillion = 10^12
    if (absVal >= 1e12) {
      return sign + formatWithSymbol((absVal / 1e12).toFixed(2) + " Trillion", c);
    }
    // 1 Billion = 10^9
    if (absVal >= 1e9) {
      return sign + formatWithSymbol((absVal / 1e9).toFixed(2) + " Billion", c);
    }
    // 1 Million = 10^6
    if (absVal >= 1e6) {
      return sign + formatWithSymbol((absVal / 1e6).toFixed(2) + " Million", c);
    }
    return sign + formatWithSymbol(absVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), c);
  }
}

/**
  * Formats stock price or target values as formatted standard numbers (no text words like Crore)
  */
export function formatPrice(price: number, sourceCurrency: string, targetCurrency: string, showBoth = false): string {
  const s = (sourceCurrency || "USD").toUpperCase();
  const t = (targetCurrency || "USD").toUpperCase();
  
  const converted = convertCurrency(price, s, t);
  let formattedTarget = "";
  
  if (t === "INR") {
    formattedTarget = formatWithSymbol(formatIndianNumber(converted), "INR");
  } else {
    formattedTarget = formatWithSymbol(converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), t);
  }
  
  if (showBoth && s !== t) {
    let formattedSource = "";
    if (s === "INR") {
      formattedSource = formatWithSymbol(formatIndianNumber(price), "INR");
    } else {
      formattedSource = formatWithSymbol(price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), s);
    }
    return `${formattedTarget} (${formattedSource})`;
  }
  
  return formattedTarget;
}

/**
  * Formats financial values (like Revenue, EBITDA) that are originally reported in Millions of the source currency.
  */
export function formatFinancialValue(valueInMillions: number, sourceCurrency: string, targetCurrency: string, showBoth = false): string {
  const s = (sourceCurrency || "USD").toUpperCase();
  const t = (targetCurrency || "USD").toUpperCase();
  
  // Convert millions base to absolute base
  const sourceValAbsolute = valueInMillions * 1e6;
  const targetValAbsolute = convertCurrency(sourceValAbsolute, s, t);
  
  const formattedTarget = formatCompact(targetValAbsolute, t);
  
  if (showBoth && s !== t) {
    const formattedSource = formatCompact(sourceValAbsolute, s);
    return `${formattedTarget} (${formattedSource})`;
  }
  
  return formattedTarget;
}
