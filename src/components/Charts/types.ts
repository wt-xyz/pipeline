export interface VestingPoint {
  date: Date;
  amount: number;
}

export interface VestingScheduleProps {
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  points: VestingPoint[];
  onPointsChange: (points: VestingPoint[]) => void;
}
