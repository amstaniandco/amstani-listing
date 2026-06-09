"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsPoint {
  label: string;
  revenue: number;
  orders: number;
}

function AnalyticsChart({ data }: { data: AnalyticsPoint[] }) {
  return (
    <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
      <CardHeader>
        <CardTitle>Performance trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="label" stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} />
              <YAxis stroke="currentColor" className="text-slate-400" tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ stroke: "rgba(79,70,229,0.25)" }}
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid rgba(148,163,184,0.2)",
                  background: "rgba(15,23,42,0.95)",
                  color: "white",
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fill="url(#revenueGradient)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export { AnalyticsChart };
