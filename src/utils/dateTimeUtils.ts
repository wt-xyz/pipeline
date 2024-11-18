import { BN } from "fuels";

export function convertTaiTimeToUnixTimeMilliseconds(num: string) {
  return new BN(
    (BigInt(num) - BigInt(Math.pow(2, 62)) - BigInt(10)).toString(),
  ).mul(1000);
}

export function convertTaiTimeBNToUnixTimeMilliseconds(input: BN) {
  return convertTaiTimeToUnixTimeMilliseconds(input.toString(10));
}

export function convertUnixTimeMillisecondsToTaiTime(input: BN) {
  return input.div(1000).add(10).add(new BN(2).pow(62));
}

export function convertTaiTimeBNToDate(input: BN) {
  const unixTimeBN = convertTaiTimeToUnixTimeMilliseconds(input.toString(10));
  return new Date(unixTimeBN.toNumber());
}

export function daysAwayFromTaiTimeBN(taiTime: BN): number {
  if (daysAway(convertTaiTimeBNToUnixTimeMilliseconds(taiTime).toNumber()) >= 0)
    return daysAway(convertTaiTimeBNToUnixTimeMilliseconds(taiTime).toNumber());
  else return 0;
}

export function daysAway(unixTimestamp: number): number {
  // Current date and time
  const now = new Date();

  // Convert Unix timestamp from seconds to milliseconds and create a Date object
  const targetDate = new Date(unixTimestamp);

  // Compute the difference in milliseconds
  const difference = targetDate.getTime() - now.getTime();

  // Convert milliseconds to days (1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
  const days = difference / (1000 * 60 * 60 * 24);

  // Return the number of days, rounded to the nearest whole number
  return Math.round(days);
}

export function getDaysBetweenTaiTimes(taiTime1: BN, taiTime2: BN): number {
  return getDaysBetweenDates(
    convertTaiTimeBNToDate(taiTime1),
    convertTaiTimeBNToDate(taiTime2),
  );
}

export function getDaysBetweenDates(date1: Date, date2: Date): number {
  const difference = date2.getTime() - date1.getTime();
  const days = difference / (1000 * 60 * 60 * 24);
  return Math.round(days);
}

export function percentageCompleteFromTimestamps(
  startTime: Date,
  endTime: Date,
) {
  const currentTime = Date.now();
  const totalDuration = endTime.getTime() - startTime.getTime();
  const elapsedTime = Math.max(currentTime - startTime.getTime(), 0);
  return (elapsedTime / totalDuration) * 100;
}
