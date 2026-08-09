// Unit tests for currency conversion and formatting engine
import { formatFinancialValue, formatIndianNumber, formatCompact, convertCurrency } from "../src/utils/currency";

console.log("================================================================================");
console.log("RUNNING CURRENCY FORMATTING & UNIT CONVERSION UNIT TESTS");
console.log("================================================================================");

let failed = false;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    failed = true;
  } else {
    console.log(`[PASS] ${message}`);
  }
}

// 1. Test convertCurrency
const rateInr = convertCurrency(100.0, "USD", "INR");
assert(Math.abs(rateInr - 8350.0) < 0.01, `convertCurrency 100 USD to INR: expected 8350, got ${rateInr}`);

const rateUsd = convertCurrency(8350.0, "INR", "USD");
assert(Math.abs(rateUsd - 100.0) < 0.01, `convertCurrency 8350 INR to USD: expected 100, got ${rateUsd}`);

// 2. Test formatIndianNumber
const formattedIndian = formatIndianNumber(123456789.12);
assert(formattedIndian === "12,34,56,789.12", `formatIndianNumber 123456789.12: expected "12,34,56,789.12", got "${formattedIndian}"`);

// 3. Test formatCompact (INR)
const compactInrLakhCrore = formatCompact(352475938816, "INR");
assert(compactInrLakhCrore === "₹35,247.59 Crore", `formatCompact 352,475,938,816 INR: expected "₹35,247.59 Crore", got "${compactInrLakhCrore}"`);

const compactInrLakh = formatCompact(550000, "INR");
assert(compactInrLakh === "₹5.50 Lakh", `formatCompact 550,000 INR: expected "₹5.50 Lakh", got "${compactInrLakh}"`);

// 4. Test formatFinancialValue (value originally in Millions)
// Revenue of 3,577.09 Million INR
const revenueStr = formatFinancialValue(3577.088, "INR", "INR");
assert(revenueStr === "₹357.71 Crore", `formatFinancialValue 3577.088 M INR to INR: expected "₹357.71 Crore", got "${revenueStr}"`);

// Revenue of 9,646,930 Million INR (Reliance)
const relRevenueStr = formatFinancialValue(9646930.0, "INR", "INR");
assert(relRevenueStr === "₹9.65 Lakh Crore", `formatFinancialValue 9,646,930 M INR to INR: expected "₹9.65 Lakh Crore", got "${relRevenueStr}"`);

// Market Cap of Cupid: 352,475.94 Million INR
const cupidMcapStr = formatFinancialValue(352475.94, "INR", "INR");
assert(cupidMcapStr === "₹35,247.59 Crore", `formatFinancialValue 352,475.94 M INR to INR: expected "₹35,247.59 Crore", got "${cupidMcapStr}"`);

console.log("================================================================================");
if (failed) {
  console.error("UNIT TESTS FAILED");
  process.exit(1);
} else {
  console.log("ALL UNIT TESTS PASSED");
  process.exit(0);
}
