"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatUnits } from "viem";
import { useTheme } from "next-themes";
import { chartColors, getChartTheme } from "@/lib/chart-theme";

interface TokenHolder {
  address: string;
  balance: bigint;
}

interface TokenDistributionChartProps {
  holders: TokenHolder[];
  totalSupply: bigint;
}

export function TokenDistributionChart({
  holders,
  totalSupply,
}: TokenDistributionChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const currentTheme = getChartTheme(isDark);

  const chartData = useMemo(() => {
    console.log("Holders data:", holders);
    return holders
      .map((holder) => ({
        name: `${holder.address.slice(0, 6)}...${holder.address.slice(-4)}`,
        value: Number(formatUnits(holder.balance, 18)),
        fullAddress: holder.address,
        percentage: (Number(holder.balance) * 100) / Number(totalSupply),
      }))
      .sort((a, b) => b.value - a.value) // Sort by balance descending
      .slice(0, 5); // Show top 5 holders
  }, [holders, totalSupply]);

  if (holders.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-secondary/50 rounded-lg">
        <p className="text-sm text-gray-500">No token distribution data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card p-3 rounded-lg border border-border">
          <p className="text-sm font-medium">{data.fullAddress}</p>
          <p className="text-sm text-muted-foreground">
            Balance: {data.value.toLocaleString()} tokens
          </p>
          <p className="text-sm text-muted-foreground">
            {data.percentage.toFixed(2)}% of total supply
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px] rounded-lg p-4" style={{ background: currentTheme.background }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill={chartColors.series[0]}
            dataKey="value"
            className="stroke-background"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={chartColors.series[index % chartColors.series.length]}
                className="hover:opacity-80 transition-opacity"
                stroke={currentTheme.background}
              />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip />} 
            wrapperStyle={{ outline: "none" }}
          />
          <Legend 
            formatter={(value: string) => (
              <span style={{ color: currentTheme.text }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
