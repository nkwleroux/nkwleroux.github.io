export type ChildrenLifeStage = "toddlers" | "small kids" | "teenagers" | "adults";

const fullMonthDifference = (start: Date, end: Date): number => {
  let months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
};

export const durationSince = (isoDate: string, now = new Date()): string => {
  const start = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return "0 months";

  const totalMonths = fullMonthDifference(start, now);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0 || parts.length === 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  return parts.join(" and ");
};

export const childrenLifeStage = (birthYear: number, now = new Date()): ChildrenLifeStage => {
  const approximateAge = Math.max(0, now.getFullYear() - birthYear);
  if (approximateAge <= 3) return "toddlers";
  if (approximateAge <= 12) return "small kids";
  if (approximateAge <= 17) return "teenagers";
  return "adults";
};
