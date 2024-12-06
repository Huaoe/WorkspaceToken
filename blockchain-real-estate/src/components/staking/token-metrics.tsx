import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TokenMetricsProps {
  tokenAddress: string;
  stakingHistory: {
    timestamp: number;
    amount: number;
    apy: number;
  }[];
  totalStaked: number;
  averageStakingPeriod: number;
  currentAPY: number;
}

const TokenMetrics: React.FC<TokenMetricsProps> = ({
  tokenAddress,
  stakingHistory,
  totalStaked,
  averageStakingPeriod,
  currentAPY,
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Staked</CardTitle>
                <CardDescription>Current total tokens staked</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStaked.toLocaleString()} Tokens</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Staking Period</CardTitle>
                <CardDescription>Average time tokens are staked</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageStakingPeriod} Days</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current APY</CardTitle>
                <CardDescription>Annual Percentage Yield</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentAPY}%</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Staking History</CardTitle>
              <CardDescription>Historical staking data and APY</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stakingHistory}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={formatDate}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      labelFormatter={(value) => formatDate(Number(value))}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="amount"
                      name="Staked Amount"
                      stroke="#8884d8"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="apy"
                      name="APY (%)"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TokenMetrics;
