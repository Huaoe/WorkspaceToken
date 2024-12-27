"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatUnits } from "viem";
import { chartColors, getChartTheme } from "@/lib/chart-theme";

interface PurchaseData {
  id: number;
  timestamp: number;
  amount: bigint;
  price: bigint;
}

interface PurchaseHistoryChartProps {
  purchases: PurchaseData[];
}

export function PurchaseHistoryChart({ purchases }: PurchaseHistoryChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const currentTheme = getChartTheme(isDark);

  const chartData = useMemo(() => {
    console.log("Processing purchases for chart:", purchases);
    return purchases.map((purchase) => {
      const date = new Date(purchase.timestamp * 1000);
      return {
        time: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        fullDate: date.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        }),
        tokens: Number(formatUnits(purchase.amount, 18)),
        price: Number(formatUnits(purchase.price, 6)),
      };
    });
  }, [purchases]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: currentTheme.background,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: "0.5rem",
          padding: "12px",
        }}>
          <p style={{ color: currentTheme.text, marginBottom: "4px" }}>
            {payload[0].payload.fullDate}
          </p>
          <p style={{ color: currentTheme.text }}>
            <span style={{ color: chartColors.accent.primary }}>Tokens: </span>
            {payload[0].value.toLocaleString()}
          </p>
          <p style={{ color: currentTheme.text }}>
            <span style={{ color: chartColors.accent.secondary }}>Price: </span>
            {payload[1].value.toLocaleString()} EURC
          </p>
        </div>
      );
    }
    return null;
  };

  if (purchases.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] rounded-lg" 
        style={{ background: currentTheme.background, color: currentTheme.textMuted }}>
        <p>No purchase history available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] rounded-lg p-4" 
      style={{ background: currentTheme.background }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={currentTheme.grid} 
          />
          <XAxis
            dataKey="time"
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fill: currentTheme.textMuted }}
            stroke={currentTheme.border}
          />
          <YAxis
            yAxisId="left"
            label={{ 
              value: "Tokens", 
              angle: -90, 
              position: "insideLeft",
              style: { fill: currentTheme.textMuted }
            }}
            tick={{ fill: currentTheme.textMuted }}
            stroke={currentTheme.border}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ 
              value: "Price (EURC)", 
              angle: 90, 
              position: "insideRight",
              style: { fill: currentTheme.textMuted }
            }}
            tick={{ fill: currentTheme.textMuted }}
            stroke={currentTheme.border}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="tokens"
            stroke={chartColors.accent.primary}
            strokeWidth={2}
            dot={{ fill: chartColors.accent.primary }}
            activeDot={{ r: 8, fill: chartColors.accent.primary }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="price"
            stroke={chartColors.accent.secondary}
            strokeWidth={2}
            dot={{ fill: chartColors.accent.secondary }}
            activeDot={{ r: 8, fill: chartColors.accent.secondary }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
