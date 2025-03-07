"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { VestingPoint } from "./types";
import {
  formatDate,
  interpolateDate,
  dateToPercentage,
} from "@/utils/date-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateVestingInfo, formatAmount } from "./vesting-utils";
import {
  Button,
  Card,
  CardSection,
  NumberInput,
  Title,
  SimpleGrid,
  Table,
} from "@mantine/core";
import { IconCalendar } from "@tabler/icons-react";
import { CustomCardSection, CustomLabelComponent } from "../CreateStreamForm";
import { DateInput } from "@mantine/dates";
import { initialData } from "@/utils/vesting-data-utils";
import { useAppDispatch } from "@/redux/store-hooks";
import { setStreamData, setVestingInfo } from "@/redux/vestingSlice";

export default function VestingSchedule() {
  const [startDate, setStartDate] = useState<Date>(initialData.startDate);
  const [endDate, setEndDate] = useState<Date>(initialData.endDate);
  const [totalAmount, setTotalAmount] = useState(initialData.totalAmount);
  const [points, setPoints] = useState<VestingPoint[]>(initialData.points);

  const [dragPoint, setDragPoint] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const leftMargin = 100;
  const rightMargin = 60;
  // Calculate the usable width for the chart
  const chartWidth = 920 - leftMargin - rightMargin;

  const topMargin = 50;
  const bottomPosition = 420 + topMargin;

  const toSvgX = (date: Date) => {
    const percentage = dateToPercentage(date, startDate, endDate);
    return (percentage / 100) * chartWidth + leftMargin;
  };

  const toSvgY = (amount: number) => {
    return bottomPosition - (amount / totalAmount) * 400;
  };

  const fromSvgY = (y: number): number => {
    const normalizedY = (bottomPosition - y) / 400;
    return normalizedY * totalAmount;
  };

  const isValidPoint = useCallback(
    (newPoint: VestingPoint, currentPoints: VestingPoint[]) => {
      return currentPoints.every((point) => {
        if (point.date < newPoint.date) {
          return point.amount <= newPoint.amount;
        } else if (point.date > newPoint.date) {
          return point.amount >= newPoint.amount;
        }
        return true;
      });
    },
    [],
  );

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragPoint(index);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (
      dragPoint === null ||
      !svgRef.current ||
      dragPoint === 0 ||
      dragPoint === points.length - 1
    )
      return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - leftMargin;
    const y = e.clientY - rect.top - topMargin;

    const newPoints = [...points];
    const percentage = (x / chartWidth) * 100;
    const newDate = interpolateDate(startDate, endDate, percentage);

    // Use the fromSvgY function to calculate amount from y position
    const newAmount = Math.max(0, Math.min(totalAmount, fromSvgY(y)));

    const newPoint = {
      ...newPoints[dragPoint],
      date: newDate,
      amount: newAmount,
    };

    if (
      isValidPoint(
        newPoint,
        newPoints.filter((_, i) => i !== dragPoint),
      ) &&
      newDate > points[dragPoint - 1].date &&
      newDate < points[dragPoint + 1].date
    ) {
      newPoints[dragPoint] = newPoint;
      setPoints(newPoints);
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || dragPoint !== null) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - leftMargin;
    const y = e.clientY - rect.top - topMargin;

    const nearExistingPoint = points.findIndex((point) => {
      const pointX = toSvgX(point.date);
      const pointY = toSvgY(point.amount);
      const distance = Math.sqrt(
        Math.pow(x - pointX + leftMargin, 2) +
          Math.pow(y - pointY + topMargin, 2),
      );
      return distance < 20;
    });

    if (nearExistingPoint !== -1) {
      setDragPoint(nearExistingPoint);
      return;
    }

    const percentage = (x / chartWidth) * 100;
    const newDate = interpolateDate(startDate, endDate, percentage);
    const newAmount = fromSvgY(y);

    const newPoint = { date: newDate, amount: newAmount };

    if (isValidPoint(newPoint, points)) {
      const insertIndex = points.findIndex((p) => p.date > newDate);
      if (insertIndex !== -1) {
        const newPoints = [...points];
        newPoints.splice(insertIndex, 0, newPoint);
        setPoints(newPoints);
      }
    }
  };

  const handleMouseUp = useCallback(() => {
    setDragPoint(null);
  }, []);

  const removePoint = (index: number) => {
    if (points.length > 2 && index !== 0 && index !== points.length - 1) {
      setPoints(points.filter((_, i) => i !== index));
    }
  };

  const dispatch = useAppDispatch();

  const handleStartDateChange = (e: Date | string) => {
    const newStartDate = new Date(e);
    setStartDate(newStartDate);
    dispatch(
      setStreamData({
        streamStartDate: newStartDate.getTime(),
      }),
    );
    setPoints([
      { date: newStartDate, amount: 0 },
      { date: endDate, amount: totalAmount },
    ]);
  };

  const handleEndDateChange = (e: Date | string) => {
    const newEndDate = new Date(e);
    setEndDate(newEndDate);
    dispatch(setStreamData({ streamEndDate: newEndDate.getTime() }));
    setPoints([
      { date: startDate, amount: 0 },
      { date: newEndDate, amount: totalAmount },
    ]);
  };

  const handleTotalAmountChange = (e: string) => {
    const newTotalAmount = Number.parseFloat(e);
    if (!isNaN(newTotalAmount) && newTotalAmount > 0) {
      setTotalAmount(newTotalAmount);
      dispatch(setStreamData({ streamSize: newTotalAmount }));
      setPoints([
        { date: startDate, amount: 0 },
        { date: endDate, amount: newTotalAmount },
      ]);
    }
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  // Calculate tick values based on total amount
  const calculateTicks = () => {
    // For linear scale, divide into 5 equal parts
    return Array.from({ length: 5 }, (_, i) => (i * totalAmount) / 4);
  };

  const ticks = calculateTicks();

  const dateMarkers = Array.from({ length: 7 }, (_, i) => {
    const date = interpolateDate(startDate, endDate, i * 16.67);
    return { date, x: toSvgX(date) };
  });

  const rightEdge = leftMargin + chartWidth;

  const computeVestingInfo = useMemo(() => {
    const data: ReturnType<typeof calculateVestingInfo>[] = [];

    points.forEach((point, i) => {
      const info = calculateVestingInfo(
        point,
        points[i - 1] || null,
        points[i + 1] || null,
        startDate,
        endDate,
        totalAmount,
      );
      data.push(info);
    });
    return data;
  }, [points, startDate, endDate, totalAmount]);

  useEffect(() => {
    dispatch(setVestingInfo(computeVestingInfo));
  }, [computeVestingInfo, dispatch]);

  return (
    <Card>
      <CustomCardSection>
        <Title order={4}> Vesting Designer</Title>
      </CustomCardSection>

      <CardSection p="md">
        <SimpleGrid p={"md"} cols={{ base: 1, xs: 2, md: 2, lg: 2 }}>
          <Card>
            <DateInput
              label={<CustomLabelComponent>Start Date</CustomLabelComponent>}
              id="startDate"
              value={startDate}
              onChange={(val) => {
                if (val) {
                  handleStartDateChange(val);
                }
              }}
              leftSection={<IconCalendar size={16} stroke={1.5} />}
              placeholder="Select date"
            />
          </Card>

          <Card>
            <DateInput
              label={<CustomLabelComponent>End Date</CustomLabelComponent>}
              id="endDate"
              value={endDate}
              onChange={(val) => {
                if (val) {
                  handleEndDateChange(val);
                }
              }}
              leftSection={<IconCalendar size={16} stroke={1.5} />}
              placeholder="Select date"
            />
          </Card>
          <Card>
            <NumberInput
              label={
                <CustomLabelComponent>
                  How much do you want to stream in total? (USDC)
                </CustomLabelComponent>
              }
              id="totalAmount"
              value={totalAmount}
              onChange={(val) => {
                if (val) {
                  handleTotalAmountChange(val.toString());
                }
              }}
              min={0.00000001}
              placeholder="Enter amount"
            />
          </Card>
        </SimpleGrid>
        <div className="rounded-lg p-4 bg-transparent mb-4 overflow-x-auto relative">
          <TooltipProvider>
            <svg
              ref={svgRef}
              width="920"
              height="530"
              onMouseMove={handleMouseMove}
              onMouseDown={handleSvgClick}
              onMouseUp={handleMouseUp}
              className="w-full h-full cursor-crosshair"
              viewBox="0 0 920 530"
            >
              <text
                x={leftMargin - 10}
                y={topMargin - 15}
                fill="#e8e8e8"
                textAnchor="end"
                className="text-sm font-medium"
              >
                Total Vested
              </text>

              {ticks.map((tickValue, i) => (
                <g key={`h-${i}`} className="text-gray-700">
                  <line
                    x1={leftMargin}
                    y1={toSvgY(tickValue)}
                    x2={rightEdge}
                    y2={toSvgY(tickValue)}
                    stroke="#9E9E9E"
                    strokeDasharray="2,2"
                    strokeWidth="1"
                  />
                  <text
                    x={leftMargin - 10}
                    y={toSvgY(tickValue)}
                    fill="#9E9E9E"
                    dominantBaseline="middle"
                    textAnchor="end"
                    className="text-xs"
                  >
                    {formatAmount(tickValue)}
                  </text>
                </g>
              ))}

              {dateMarkers.map(({ x }, i) => (
                <line
                  key={`v-${i}`}
                  x1={x}
                  y1={topMargin}
                  x2={x}
                  y2={bottomPosition}
                  stroke="#9E9E9E"
                  strokeDasharray="2,2"
                  strokeWidth="1"
                  className="text-gray-700"
                />
              ))}

              {dateMarkers.map(({ date, x }, i) => (
                <g key={`d-${i}`}>
                  <rect
                    x={x - 40}
                    y={bottomPosition + 10}
                    width="80"
                    height="25"
                    rx="4"
                    fill="hsl(var(--muted))"
                  />
                  <text
                    x={x}
                    y={bottomPosition + 25}
                    fill="hsl(var(--muted-foreground))"
                    textAnchor="middle"
                    className="text-xs font-medium"
                  >
                    {formatDate(date)}
                  </text>
                </g>
              ))}

              {points.map((point, i) => {
                if (i === 0) return null;
                const prevPoint = points[i - 1];
                return (
                  <g key={`l-${i}`}>
                    <line
                      x1={toSvgX(prevPoint.date)}
                      y1={toSvgY(prevPoint.amount)}
                      x2={toSvgX(point.date)}
                      y2={toSvgY(point.amount)}
                      stroke="#13f598"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}

              {points.map((point, i) => (
                <Tooltip key={`t-${i}`}>
                  <TooltipTrigger asChild>
                    <circle
                      cx={toSvgX(point.date)}
                      cy={toSvgY(point.amount)}
                      r="6"
                      fill={dragPoint === i ? "#13f598" : "#13f598"}
                      stroke="#13f598"
                      strokeWidth="2"
                      onMouseDown={handleMouseDown(i)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleMouseDown(i)(e as unknown as React.MouseEvent);
                        }
                      }}
                      style={{
                        cursor:
                          i === 0 || i === points.length - 1
                            ? "not-allowed"
                            : "grab",
                        outline: "none",
                      }}
                      className="focus:ring-2 focus:ring-[#13f598] focus:ring-offset-2 focus:ring-offset-background"
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    className="bg-white text-black p-2 rounded shadow-lg border border-gray-200 z-[9999]"
                    style={{ backgroundColor: "white" }}
                  >
                    {(() => {
                      const info = calculateVestingInfo(
                        point,
                        points[i - 1] || null,
                        points[i + 1] || null,
                        startDate,
                        endDate,
                        totalAmount,
                      );
                      return (
                        <div className="text-sm">
                          <p>
                            <strong>Date:</strong> {info.date}
                          </p>
                          <p>
                            <strong>Amount:</strong> {info.amount} USDC (
                            {info.vestedPercentage}% vested)
                          </p>
                          <p>
                            <strong>Time elapsed:</strong> {info.timeElapsed}{" "}
                            days
                          </p>
                          <p>
                            <strong>Time remaining:</strong>{" "}
                            {info.timeRemaining} days
                          </p>
                        </div>
                      );
                    })()}
                  </TooltipContent>
                </Tooltip>
              ))}
            </svg>
          </TooltipProvider>
        </div>
      </CardSection>
      <SimpleGrid p={"lg"} cols={{ base: 1, xs: 1, md: 1, lg: 1 }}>
        <Table p={"lg"}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Amount (USDC)</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {points.map((point, i) => (
              <Table.Tr key={i}>
                <Table.Td>{formatDate(point.date)}</Table.Td>
                <Table.Td>{formatAmount(point.amount)} USDC</Table.Td>
                <Table.Td>
                  {i !== 0 && i !== points.length - 1 && (
                    <Button size="sm" onClick={() => removePoint(i)}>
                      Remove
                    </Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </SimpleGrid>
    </Card>
  );
}
