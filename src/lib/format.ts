import { formatDistanceToNowStrict, parseISO } from "date-fns";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Pakistani Rupees — used to show the rep-entered wholesale alongside the USD
// conversion on the admin side.
export function formatPkr(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string) {
  return formatDistanceToNowStrict(parseISO(value), { addSuffix: true });
}
