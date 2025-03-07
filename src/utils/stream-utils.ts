import { BN } from "fuels";
import { PiecewiseLinearVestingCurveInput } from "../../types/TokenStreaming";

export type VestingPoint = {
  dateTimeStamp: number;
  vestedPercentage: string;
};

/**
 * Cleans vesting data by removing duplicate days and skipping non-increasing percentages.
 *
 * @param vestingData - Raw vesting data.
 * @returns Processed vesting data.
 */
function cleanVestingData(vestingData: VestingPoint[]): VestingPoint[] {
  const map = new Map<string, VestingPoint>();

  for (const point of vestingData) {
    const dateKey = new Date(point.dateTimeStamp).toISOString().split("T")[0]; // Extract only YYYY-MM-DD

    // Keep only the entry with the highest vested percentage for that date
    if (
      !map.has(dateKey) ||
      parseFloat(point.vestedPercentage) >
        parseFloat(map.get(dateKey)!.vestedPercentage)
    ) {
      map.set(dateKey, point);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => a.dateTimeStamp - b.dateTimeStamp,
  );
}

/**
 * Converts vesting data into smart contract-compatible breakpoints.
 *
 * @param vestingData - Raw vesting data.
 * @returns Smart contract-ready piecewise linear vesting curve.
 */
export function generateBreakpoints(vestingData: VestingPoint[]) {
  if (!vestingData || vestingData.length === 0)
    return {
      breakpoints: [] as any,
    };

  // Step 1: Remove duplicate days and skip non-increasing points
  const cleanedData = cleanVestingData(vestingData);

  // Step 2: Convert to smart contract format
  const startTime = new BN(cleanedData[0].dateTimeStamp.toString());
  const endTime = new BN(
    cleanedData[cleanedData.length - 1].dateTimeStamp.toString(),
  );
  const totalDuration = endTime.sub(startTime);

  const breakpoints = cleanedData.map((point) => {
    const elapsedTime = new BN(point.dateTimeStamp.toString()).sub(startTime);
    const durationPercentageE6 = elapsedTime
      .mul(new BN(100 * 1e6))
      .div(totalDuration);
    const vestedPercentageE6 = new BN(
      Math.floor(parseFloat(point.vestedPercentage) * 1e6).toString(),
    );

    return {
      duration_percentage_e6: durationPercentageE6,
      vested_percentage_e6: vestedPercentageE6,
    };
  });

  // Ensure the last breakpoint is exactly 100_000_000
  breakpoints[breakpoints.length - 1].vested_percentage_e6 = new BN(100 * 1e6);

  return {
    breakpoints: breakpoints as PiecewiseLinearVestingCurveInput["breakpoints"],
  };
}

export type ReadableBreakpoint = {
  durationPercentage: string;
  vestedPercentage: string;
};

export type FullBreakpoint = {
  duration_percentage_e6: BN;
  vested_percentage_e6: BN;
};

/**
 * Ensures the final breakpoints array has exactly 64 elements.
 * it fills the remaining slots with `BN(0)`.
 *
 * @param breakpoints - The output from `generateBreakpoints()`
 * @returns An array of 64 breakpoints, with empty slots filled as `BN(0)`.
 */
export function fillBreakpointsTo64(
  breakpoints: PiecewiseLinearVestingCurveInput["breakpoints"],
) {
  const totalNeeded = 64;
  const existingCount = breakpoints.length;
  const emptySlotsNeeded = totalNeeded - existingCount;

  const filledBreakpoints = breakpoints.map((bp) => ({
    duration_percentage_e6: bp.duration_percentage_e6,
    vested_percentage_e6: bp.vested_percentage_e6,
  }));

  // Generate empty breakpoints filled with `BN(0)`
  for (let i = 0; i < emptySlotsNeeded; i++) {
    filledBreakpoints.push({
      duration_percentage_e6: new BN(0), // Empty duration
      vested_percentage_e6: new BN(0), // Empty vested percentage
    });
  }

  return filledBreakpoints as PiecewiseLinearVestingCurveInput["breakpoints"];
}

/**
 * Converts the breakpoints into human-readable values.
 * utility function to present the data in a readable format in console
 * this is just for use when i want to view numbers in the console
 *
 * @param breakpoints - The array of `BreakpointInput` from `generateBreakpoints()`.
 * @returns An array of formatted breakpoints with understandable percentages.
 */
export function convertBreakpointsToReadable(
  breakpoints: PiecewiseLinearVestingCurveInput["breakpoints"],
): ReadableBreakpoint[] {
  return breakpoints.map((breakpoint) => {
    return {
      durationPercentage:
        (
          parseFloat(breakpoint.duration_percentage_e6.toString()) / 1e6
        ).toFixed(2) + "%",
      vestedPercentage:
        (parseFloat(breakpoint.vested_percentage_e6.toString()) / 1e6).toFixed(
          2,
        ) + "%",
    };
  });
}
