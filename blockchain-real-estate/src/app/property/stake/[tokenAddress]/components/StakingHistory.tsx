"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StakingHistoryProps {
  stakingHistory: any[];
  rewardsHistory: any[];
}

export function StakingHistory({ stakingHistory, rewardsHistory }: StakingHistoryProps) {
  return (
    <Card className="md:col-span-2">
      <Tabs defaultValue="staking" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="staking">Staking History</TabsTrigger>
          <TabsTrigger value="rewards">Rewards History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="staking">
          <CardHeader>
            <CardTitle>Staking History</CardTitle>
            <CardDescription>Your staking activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            {stakingHistory.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stakingHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dateTime" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#2563eb" 
                      name="Staked Amount"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No staking history available
              </p>
            )}
          </CardContent>
        </TabsContent>

        <TabsContent value="rewards">
          <CardHeader>
            <CardTitle>Rewards History</CardTitle>
            <CardDescription>Your earned rewards over time</CardDescription>
          </CardHeader>
          <CardContent>
            {rewardsHistory.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rewardsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="reward" 
                      stroke="#10b981" 
                      name="EURC Rewards"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No rewards history available
              </p>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
