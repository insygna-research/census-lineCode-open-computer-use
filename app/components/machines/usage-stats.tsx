"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Cpu, DollarSign, TrendingUp } from "lucide-react";
import type { MachineLimits } from "@/types/machines.types";

interface UsageStatsProps {
  usage: {
    total_hours: number;
    total_cpu_hours: number;
    total_estimated_cost: number;
  };
  limits?: MachineLimits;
}

export function UsageStats({ usage, limits }: UsageStatsProps) {
  const usagePercentage = limits 
    ? (usage.total_hours / limits.maxHoursPerMonth) * 100
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Statistics</CardTitle>
        <CardDescription>Current month usage and costs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hours Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Total Hours</span>
            </div>
            <span className="font-medium">
              {usage.total_hours.toFixed(1)} / {limits?.maxHoursPerMonth || "∞"}
            </span>
          </div>
          {limits && limits.maxHoursPerMonth > 0 && (
            <Progress value={usagePercentage} className="h-2" />
          )}
        </div>

        {/* CPU Hours */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <span>CPU Hours</span>
            </div>
            <span className="font-medium">{usage.total_cpu_hours.toFixed(1)}</span>
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>Estimated Cost</span>
            </div>
            <span className="font-medium">
              {formatCurrency(usage.total_estimated_cost)}
            </span>
          </div>
        </div>

        {/* Tier Info */}
        {limits && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Account Tier</span>
              <span className="font-medium capitalize">{limits.tier}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Machine Limit</span>
              <span className="font-medium">
                {limits.maxMachines} ({limits.maxRunningMachines} concurrent)
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}