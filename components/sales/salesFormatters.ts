const numberFormatter = new Intl.NumberFormat("en-US");
const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatSalesNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatSalesCurrency(value: number): string {
  return `৳${decimalFormatter.format(value)}`;
}

export function formatSalesPercent(value: number): string {
  const formatted = decimalFormatter.format(Math.abs(value));
  if (value > 0) return `+${formatted}%`;
  if (value < 0) return `-${formatted}%`;
  return `${formatted}%`;
}
