import { VestingPoint } from "@/components/Charts/types";

type StepPoint = { date: Date; amount: number };
type StepData = {
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  points: StepPoint[];
};

function generateStepData(totalAmount: number): StepData {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 3);

  const points: StepPoint[] = [{ date: startDate, amount: 0 }];
  let lastDate = startDate.getTime();

  // Generate 4 strictly increasing dates & amounts
  for (let i = 1; i <= 4; i++) {
    const dateRange = (endDate.getTime() - lastDate) / (5 - i);
    const nextDate = new Date(
      lastDate + dateRange * (0.2 + Math.random() * 0.8),
    );
    lastDate = nextDate.getTime(); // Ensure increasing order

    points.push({ date: nextDate, amount: Math.round((i / 5) * totalAmount) });
  }

  points.push({ date: endDate, amount: totalAmount });

  return { startDate, endDate, totalAmount, points };
}

const data = generateStepData(10);

const vestingData: {
  points: VestingPoint[];
  startDate: Date;
  endDate: Date;
  totalAmount: number;
} | null = data;

export function getVestingData(): {
  points: VestingPoint[];
  startDate: Date;
  endDate: Date;
  totalAmount: number;
} {
  if (!vestingData) {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const totalAmount = 10000;

    return {
      points: [
        { date: startDate, amount: 0 },
        { date: endDate, amount: totalAmount },
      ],
      startDate,
      endDate,
      totalAmount,
    };
  }

  return vestingData;
}

export const initialData = getVestingData();
