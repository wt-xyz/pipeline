export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function interpolateDate(
  startDate: Date,
  endDate: Date,
  percentage: number,
): Date {
  const totalMs = endDate.getTime() - startDate.getTime();
  return new Date(startDate.getTime() + totalMs * (percentage / 100));
}

export function dateToPercentage(
  date: Date,
  startDate: Date,
  endDate: Date,
): number {
  const totalMs = endDate.getTime() - startDate.getTime();
  const currentMs = date.getTime() - startDate.getTime();
  return (currentMs / totalMs) * 100;
}
