import type { VestingPoint } from "./types";
import { formatDate } from "./date-utils";

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
    amount: point.amount.toLocaleString(),
    vestedPercentage: vestedPercentage.toFixed(2),
    timeElapsed: Math.round(timeElapsed),
    timeRemaining: Math.round(timeRemaining),
    amountVestedSinceLastPoint: amountVestedSinceLastPoint.toLocaleString(),
    vestingRate: vestingRate.toFixed(2),
  };
}
