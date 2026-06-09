import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, change, icon }: StatCardProps) {
  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
          {change ? <p className="text-xs text-emerald-600 dark:text-emerald-400">{change}</p> : null}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

export { StatCard };
