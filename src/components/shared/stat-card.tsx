import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

// Minimal count card for admin/brand overviews. (The previous version carried
// trend/change analytics; that bloat was removed for the listing portal.)
function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        {icon ? <div className="text-slate-400">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}

export { StatCard };
