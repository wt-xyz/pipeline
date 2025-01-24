import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { VestingPoint } from "./types";
import { formatDate, interpolateDate, dateToPercentage } from "./date-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateVestingInfo } from "./vesting-utils";

export default function VestingSchedule() {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  );
  const [totalAmount, setTotalAmount] = useState(10000);
  const [points, setPoints] = useState<VestingPoint[]>([
    { date: startDate, amount: 0 },
    { date: endDate, amount: totalAmount },
  ]);
  const [dragPoint, setDragPoint] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const toSvgX = (date: Date) => {
    const percentage = dateToPercentage(date, startDate, endDate);
    return (percentage / 100) * 800 + 60;
  };
  const toSvgY = (amount: number) => 420 - (amount / totalAmount) * 400;

  const isValidPoint = (
    newPoint: VestingPoint,
    currentPoints: VestingPoint[],
  ) => {
    return currentPoints.every((point) => {
      if (point.date < newPoint.date) {
        return point.amount <= newPoint.amount;
      } else if (point.date > newPoint.date) {
        return point.amount >= newPoint.amount;
      }
      return true;
    });
  };

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
    const x = e.clientX - rect.left - 60;
    const y = e.clientY - rect.top - 20;

    const newPoints = [...points];
    const percentage = (x / 800) * 100;
    const newDate = interpolateDate(startDate, endDate, percentage);
    const newAmount = Math.max(
      0,
      Math.min(totalAmount, totalAmount * (1 - (y - 20) / 400)),
    );

    const newPoint = {
      ...newPoints[dragPoint],
      date: newDate,
      amount: Math.round(newAmount),
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
    const x = e.clientX - rect.left - 60;
    const y = e.clientY - rect.top - 20;

    const nearExistingPoint = points.findIndex((point) => {
      const pointX = toSvgX(point.date);
      const pointY = toSvgY(point.amount);
      const distance = Math.sqrt(
        Math.pow(x - pointX + 60, 2) + Math.pow(y - pointY + 20, 2),
      );
      return distance < 20;
    });

    if (nearExistingPoint !== -1) {
      setDragPoint(nearExistingPoint);
      return;
    }

    const percentage = (x / 800) * 100;
    const newDate = interpolateDate(startDate, endDate, percentage);
    const newAmount = Math.round(totalAmount * (1 - (y - 20) / 400));

    const newPoint = { date: newDate, amount: newAmount, isCliff: false };

    if (isValidPoint(newPoint, points)) {
      const insertIndex = points.findIndex((p) => p.date > newDate);
      if (insertIndex !== -1) {
        const newPoints = [...points];
        newPoints.splice(insertIndex, 0, newPoint);
        setPoints(newPoints);
      }
    }
  };

  const handleMouseUp = () => {
    setDragPoint(null);
  };

  const removePoint = (index: number) => {
    if (points.length > 2 && index !== 0 && index !== points.length - 1) {
      setPoints(points.filter((_, i) => i !== index));
    }
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  useEffect(() => {
    setPoints((prevPoints) => {
      const newPoints = prevPoints.map((point, index) => {
        if (index === 0) return { ...point, date: startDate, amount: 0 };
        if (index === prevPoints.length - 1)
          return { ...point, date: endDate, amount: totalAmount };
        return point;
      });

      return newPoints.reduce((acc, point, index) => {
        if (index === 0 || isValidPoint(point, acc)) {
          acc.push(point);
        } else {
          acc.push({ ...point, amount: acc[acc.length - 1].amount });
        }
        return acc;
      }, [] as VestingPoint[]);
    });
  }, [startDate, endDate, totalAmount]);

  const dateMarkers = Array.from({ length: 7 }, (_, i) => {
    const date = interpolateDate(startDate, endDate, i * 16.67);
    return { date, x: toSvgX(date) };
  });

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Vesting Designer</CardTitle>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <div className="relative">
              <Calendar className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
              <Input
                type="date"
                id="startDate"
                value={startDate.toISOString().split("T")[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="pl-8"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <div className="relative">
              <Calendar className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
              <Input
                type="date"
                id="endDate"
                value={endDate.toISOString().split("T")[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="pl-8"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="totalAmount">Total Amount (USDC)</Label>
            <Input
              type="number"
              id="totalAmount"
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 bg-black mb-4 overflow-x-auto">
          <TooltipProvider>
            <svg
              ref={svgRef}
              width="920"
              height="500"
              onMouseMove={handleMouseMove}
              onMouseDown={handleSvgClick}
              onMouseUp={handleMouseUp}
              className="w-full h-full cursor-crosshair"
              viewBox="0 0 920 500"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <g key={`h-${i}`} className="text-gray-700">
                  <line
                    x1="60"
                    y1={toSvgY((i * totalAmount) / 4)}
                    x2="860"
                    y2={toSvgY((i * totalAmount) / 4)}
                    stroke="currentColor"
                    strokeDasharray="2,2"
                    strokeWidth="1"
                  />
                  <text
                    x="55"
                    y={toSvgY((i * totalAmount) / 4)}
                    fill="currentColor"
                    dominantBaseline="middle"
                    textAnchor="end"
                    className="text-xs"
                  >
                    {((i * totalAmount) / 4).toLocaleString()}
                  </text>
                </g>
              ))}

              {dateMarkers.map(({ x }, i) => (
                <line
                  key={`v-${i}`}
                  x1={x}
                  y1="20"
                  x2={x}
                  y2="420"
                  stroke="currentColor"
                  strokeDasharray="2,2"
                  strokeWidth="1"
                  className="text-gray-700"
                />
              ))}

              {dateMarkers.map(({ date, x }, i) => (
                <g key={`d-${i}`}>
                  <rect
                    x={x - 40}
                    y="425"
                    width="80"
                    height="25"
                    rx="4"
                    fill="hsl(var(--muted))"
                  />
                  <text
                    x={x}
                    y="440"
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
                      stroke="hsl(var(--primary))"
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
                      fill={dragPoint === i ? "hsl(var(--primary))" : "white"}
                      stroke="hsl(var(--primary))"
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
                      className="focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
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
                          <p>
                            <strong>Vested since last point:</strong>{" "}
                            {info.amountVestedSinceLastPoint} USDC
                          </p>
                          <p>
                            <strong>Vesting rate:</strong> {info.vestingRate}{" "}
                            USDC/day until next point
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount (USDC)</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {points.map((point, i) => (
              <TableRow key={i}>
                <TableCell>{formatDate(point.date)}</TableCell>
                <TableCell>{point.amount.toLocaleString()}</TableCell>
                <TableCell>
                  {i !== 0 && i !== points.length - 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removePoint(i)}
                    >
                      Remove
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
