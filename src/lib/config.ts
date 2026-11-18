import { format, parseISO, isValid } from "date-fns";

export const APP_CONFIG = {
  appName: "Solace",
  tagline: "Insurance, quietly handled.",
  currency: {
    code: "LKR",
    locale: "en-LK",
    symbol: "LKR",
  },
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === "true",
};

export function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat(APP_CONFIG.currency.locale, {
      style: "currency",
      currency: APP_CONFIG.currency.code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${APP_CONFIG.currency.code} ${amount.toLocaleString()}`;
  }
}

export function formatDate(dateString: string | Date | undefined, formatStr = "MMM d, yyyy"): string {
  if (!dateString) return "";
  try {
    const d = typeof dateString === "string" ? parseISO(dateString) : new Date(dateString);
    if (!isValid(d)) return String(dateString);
    return format(d, formatStr);
  } catch {
    return String(dateString);
  }
}
