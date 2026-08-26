import { ValidationError } from "../exceptions/AppError.js";

const CURRENCY_PATTERN = /^[a-z]{3}$/i;
const MAJOR_AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.(\d{1,2}))?$/;

function normalizeCurrency(currency) {
  const value = String(currency || "").trim().toLowerCase();
  if (!CURRENCY_PATTERN.test(value)) throw new ValidationError("Currency must be a 3-letter ISO code");
  return value;
}

export function money(amountMinor, currency) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new ValidationError("Money amount must be a non-negative integer minor-unit value");
  }
  return Object.freeze({ amountMinor, currency: normalizeCurrency(currency) });
}


export function moneyFromLegacyMajorUnits(value, currency, fieldName = "amount") {
  const text = String(value ?? "").trim();
  const match = text.match(MAJOR_AMOUNT_PATTERN);
  if (!match) throw new ValidationError(`${fieldName} must contain at most two decimal places`);
  const decimal = match[1] || "";
  const minor = Number(text.split(".")[0]) * 100 + Number(decimal.padEnd(2, "0") || 0);
  return money(minor, currency);
}

export function moneyFromRecord(record, { amountField = "amount", minorField = "amount_minor", currencyField = "currency" } = {}) {
  if (Number.isSafeInteger(record?.[minorField])) return money(record[minorField], record[currencyField]);
  return moneyFromLegacyMajorUnits(record?.[amountField], record?.[currencyField], amountField);
}

export function majorUnitsFromMoney(value) {
  const amount = value?.amountMinor;
  if (!Number.isSafeInteger(amount)) throw new ValidationError("Invalid money value");
  return amount / 100;
}
