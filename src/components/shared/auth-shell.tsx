import { Shield, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

function AuthShell({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden border-b border-slate-200 p-8 sm:p-10 lg:border-b-0 lg:border-r dark:border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_32%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Amstani</p>
                <p className="text-lg font-semibold">Portal</p>
              </div>
            </div>

            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                {eyebrow}
              </div>
              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
                  {title}
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-400">{description}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Role aware", "Admin and brand experiences split cleanly."],
                ["Mock backend", "Everything persists locally with Zustand."],
                ["Premium UI", "Responsive, fast, and dashboard-focused."],
              ].map(([headline, text]) => (
                <div key={headline} className="rounded-3xl border border-slate-200 bg-white/70 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
                  <p className="font-medium text-slate-950 dark:text-white">{headline}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={cn("flex items-center justify-center p-6 sm:p-8", className)}>
          <div className="w-full max-w-lg">{children}</div>
        </div>
      </div>
    </div>
  );
}

export { AuthShell };
