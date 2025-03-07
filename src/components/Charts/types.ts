export type VestingPoint = {
  date: Date;
  amount: number;
};

export type VestingScheduleProps = {
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  points: VestingPoint[];
  onPointsChange: (points: VestingPoint[]) => void;
};
