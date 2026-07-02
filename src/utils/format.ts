export function formatKRW(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactKRW(value: number) {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absolute >= 1000000) {
    return `${sign}₩${trimNumber(absolute / 1000000)}M`;
  }

  if (absolute >= 1000) {
    return `${sign}₩${trimNumber(absolute / 1000)}K`;
  }

  return `${sign}₩${absolute.toLocaleString("ko-KR")}`;
}

export function formatPercent(value: number) {
  return `${Number.isFinite(value) ? value : 0}%`;
}

export function toCsvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function trimNumber(value: number) {
  return value.toFixed(value >= 10 ? 0 : 1).replace(".0", "");
}
