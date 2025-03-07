import type { VestingPoint } from "./types";
import { formatDate } from "@/utils/date-utils";

// Format number with appropriate precision based on value
export function formatAmount(value: number): string {
  if (value === 0) return "0";

  // For very small values, use 10^(n) notation with simplified mantissa
  if (Math.abs(value) < 0.001) {
    const scientific = value.toExponential(6);
    const [base, exponent] = scientific.split("e");
    const exponentValue = Number.parseInt(exponent);

    // Simplify the mantissa by removing unnecessary trailing zeros
    const simplifiedBase = Number.parseFloat(base).toString();

    // Format as decimal with 10^(n) notation
    return `${simplifiedBase} × 10^(${exponentValue})`;
  }

  // For small values, show more decimal places but remove trailing zeros
  if (Math.abs(value) < 1) {
    // Format with 6 decimal places, then remove trailing zeros
    return Number.parseFloat(value.toFixed(6)).toString();
  }

  // For medium values, show fewer decimal places but remove trailing zeros
  if (Math.abs(value) < 1000) {
    // Format with 4 decimal places, then remove trailing zeros
    return Number.parseFloat(value.toFixed(4)).toString();
  }

  // For large values, use locale string but ensure no unnecessary trailing zeros
  // First format with 2 decimal places
  const formatted = value.toFixed(2);
  // If it ends with .00, remove the decimal part
  if (formatted.endsWith(".00")) {
    return Number.parseInt(formatted).toString();
  }
  // Otherwise, remove trailing zeros after the decimal
  return Number.parseFloat(formatted).toString();
}

export function calculateVestingInfo(
  point: VestingPoint,
  prevPoint: VestingPoint | null,
  nextPoint: VestingPoint | null,
  startDate: Date,
  endDate: Date,
  totalAmount: number,
) {
  const vestedPercentage = (point.amount / totalAmount) * 100;
  const timeElapsed =
    (point.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const timeRemaining =
    (endDate.getTime() - point.date.getTime()) / (1000 * 60 * 60 * 24);
  const amountVestedSinceLastPoint = prevPoint
    ? point.amount - prevPoint.amount
    : point.amount;
  const vestingRate = nextPoint
    ? (nextPoint.amount - point.amount) /
      ((nextPoint.date.getTime() - point.date.getTime()) /
        (1000 * 60 * 60 * 24))
    : 0;

  return {
    date: formatDate(point.date),
    dateTimeStamp: point.date.getTime(),
    amount: formatAmount(point.amount),
    vestedPercentage: vestedPercentage.toFixed(2),
    timeElapsed: Math.round(timeElapsed),
    timeRemaining: Math.round(timeRemaining),
    amountVestedSinceLastPoint: formatAmount(amountVestedSinceLastPoint),
    vestingRate: formatAmount(vestingRate),
  };
}
