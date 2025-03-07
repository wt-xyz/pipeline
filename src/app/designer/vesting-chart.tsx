"use client";

import { Box } from "@mantine/core";
import { LinearChart } from "./charts/linear-chart";
import { PiecewiseLinear } from "./charts/piecewise-linear";

type VestingChartProps = {
  type: string;
};

export function VestingChart({ type }: VestingChartProps) {
  // Render the appropriate chart based on the type
  const renderChart = () => {
    switch (type) {
      case "linear":
        return <LinearChart />;
      case "piecewise-linear":
        return <PiecewiseLinear />;
      default:
        return <LinearChart />;
    }
  };

  return (
    <Box
      h="100%"
      w="100%"
      style={{
        display: "flex",
        alignItems: "stretch",
        justifyContent: "stretch",
        overflow: "hidden",
      }}
    >
      {renderChart()}
    </Box>
  );
}
