export function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return "...";

  if (num >= 1000) {
    return `${Math.floor(num / 1000)}K+`;
  }
  return num.toString();
}
