"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Percent, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell, type NavItem, type ShellUser } from "@/components/shared/dashboard-shell";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "admin" },
  { label: "Shipping & Taxes", href: "/admin/taxes", icon: "taxes" },
  { label: "Profile", href: "/profile", icon: "profile" },
];

// Soft PIN gate for this page. NOTE: client-side only — it hides the UI from
// casual access; the data is still admin-auth-protected server-side. The unlock
// state lives in component memory only, so the page RE-LOCKS on every visit:
// navigating away and back remounts this component and resets `unlocked` to false.
const PAGE_PIN = "9644";

interface TaxSettings {
  profitPct: number;
  tariffPct: number;
  shippingPerKg: number;
}
interface Bracket {
  minKg: number;
  maxKg: number | null;
  ratePerKg: number;
}
interface BracketRow {
  minKg: string;
  maxKg: string; // "" => open-ended
  ratePerKg: string;
}

const SAMPLE = 100;
const SAMPLE_KG = 1; // illustrative weight for the preview

export function TaxSettingsClient({
  shell,
  initialSettings,
  initialBrackets,
}: {
  shell: ShellUser;
  initialSettings: TaxSettings;
  initialBrackets: Bracket[];
}) {
  const router = useRouter();

  // PIN gate. In-memory only — starts locked on every mount, so leaving and
  // returning to the page always requires the PIN again.
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");

  function submitPin() {
    if (pin === PAGE_PIN) {
      setUnlocked(true);
      setPin("");
    } else {
      toast.error("Incorrect PIN.");
      setPin("");
    }
  }

  const [profit, setProfit] = useState(String(initialSettings.profitPct));
  const [tariff, setTariff] = useState(String(initialSettings.tariffPct));
  const [perKg, setPerKg] = useState(String(initialSettings.shippingPerKg));
  const [savingPct, setSavingPct] = useState(false);

  const [rows, setRows] = useState<BracketRow[]>(
    initialBrackets.length
      ? initialBrackets.map((b) => ({
          minKg: String(b.minKg),
          maxKg: b.maxKg == null ? "" : String(b.maxKg),
          ratePerKg: String(b.ratePerKg),
        }))
      : [{ minKg: "", maxKg: "", ratePerKg: "" }],
  );
  const [savingRates, setSavingRates] = useState(false);

  // Recompute: re-applies the saved rates to already-approved products' final
  // price (so products approved before a rate change pick up the new shipping).
  const [recomputeOpen, setRecomputeOpen] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  const p = Number(profit) || 0;
  const t = Number(tariff) || 0;
  const gKg = Number(perKg) || 0;
  const totalPct = p + t;
  // Preview: general per-kg rate × a sample 1kg parcel.
  const sampleShip = Math.round(SAMPLE_KG * gKg * 100) / 100;
  const finalSample = Math.round((SAMPLE * (1 + totalPct / 100) + sampleShip) * 100) / 100;

  async function savePcts() {
    if (p < 0 || t < 0 || gKg < 0) {
      toast.error("Values can't be negative.");
      return;
    }
    setSavingPct(true);
    try {
      const res = await fetch("/api/admin/tax-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profitPct: p, tariffPct: t, shippingPerKg: gKg }),
      });
      const data = await res.json();
      if (!data.ok) { toast.error(data.message ?? "Could not save."); return; }
      toast.success("Tax percentages updated.");
      router.refresh();
    } finally {
      setSavingPct(false);
    }
  }

  function addRow() {
    setRows((r) => [...r, { minKg: "", maxKg: "", ratePerKg: "" }]);
  }
  function updateRow(i: number, patch: Partial<BracketRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  async function saveRates() {
    const brackets: Bracket[] = [];
    for (const r of rows) {
      const minKg = Number(r.minKg);
      const ratePerKg = Number(r.ratePerKg);
      const maxKg = r.maxKg.trim() === "" ? null : Number(r.maxKg);
      if (Number.isNaN(minKg) || minKg < 0) { toast.error("Each row needs a valid min weight."); return; }
      if (Number.isNaN(ratePerKg) || ratePerKg < 0) { toast.error("Each row needs a valid per-kg rate."); return; }
      if (maxKg != null && maxKg <= minKg) { toast.error("Max weight must be greater than min weight."); return; }
      brackets.push({ minKg, maxKg, ratePerKg });
    }
    setSavingRates(true);
    try {
      const res = await fetch("/api/admin/shipping-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brackets }),
      });
      const data = await res.json();
      if (!data.ok) { toast.error(data.message ?? "Could not save rates."); return; }
      toast.success("Shipping rates updated.");
      router.refresh();
    } finally {
      setSavingRates(false);
    }
  }

  async function recompute() {
    setRecomputing(true);
    try {
      const res = await fetch("/api/admin/products/recompute", { method: "POST" });
      const data = await res.json();
      if (!data.ok) { toast.error(data.message ?? "Could not recompute prices."); return; }
      toast.success(
        data.updated === 0
          ? "All approved products were already up to date."
          : `Recomputed ${data.updated} product${data.updated === 1 ? "" : "s"}` +
              (data.unchanged ? ` · ${data.unchanged} already up to date.` : "."),
      );
      router.refresh();
    } finally {
      setRecomputing(false);
    }
  }

  if (!unlocked) {
    return (
      <DashboardShell
        title="Shipping & Taxes"
        description="Enter the PIN to manage shipping & tax settings."
        navItems={navItems}
        user={shell}
      >
        <Card className="mx-auto max-w-sm border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Locked
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This page is protected. Enter the PIN to continue.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="taxes-pin">PIN</Label>
              <Input
                id="taxes-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitPin(); }}
                placeholder="••••"
              />
            </div>
            <Button onClick={submitPin} disabled={!pin}>Unlock</Button>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Shipping & Taxes"
      description="Profit & tariff percentages plus weight-based shipping costs, applied at approval."
      navItems={navItems}
      user={shell}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* PERCENTAGES */}
          <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>Tax percentages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Applied to the wholesale price. A product can override these during review.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <PctField label="Profit Percentage" value={profit} onChange={setProfit} />
                <PctField label="Tariffs" value={tariff} onChange={setTariff} />
                <div className="space-y-1.5">
                  <Label>General shipping (per kg)</Label>
                  <Input type="number" min="0" step="0.01" value={perKg}
                    onChange={(e) => setPerKg(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <Button onClick={savePcts} disabled={savingPct}>
                <Save className="mr-2 h-4 w-4" />
                {savingPct ? "Saving…" : "Save settings"}
              </Button>
            </CardContent>
          </Card>

          {/* WEIGHT-BASED SHIPPING */}
          <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>Special per-kg rates by weight</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                By default shipping = weight × the general per-kg rate above. Add a special bracket
                to charge a different per-kg rate for a weight range (e.g. 100–200 kg @ $20/kg →
                150 kg costs $3,000). Leave “Max kg” blank for an open-ended top tier. A product can
                still override shipping with a flat custom cost during review.
              </p>

              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <span>Min kg</span>
                  <span>Max kg</span>
                  <span>Rate ($/kg)</span>
                  <span />
                </div>
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                    <Input type="number" min="0" step="0.01" value={r.minKg}
                      onChange={(e) => updateRow(i, { minKg: e.target.value })} placeholder="0" />
                    <Input type="number" min="0" step="0.01" value={r.maxKg}
                      onChange={(e) => updateRow(i, { maxKg: e.target.value })} placeholder="∞" />
                    <Input type="number" min="0" step="0.01" value={r.ratePerKg}
                      onChange={(e) => updateRow(i, { ratePerKg: e.target.value })} placeholder="0.00" />
                    <Button type="button" variant="ghost" className="text-rose-600" onClick={() => removeRow(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={addRow}>
                  <Plus className="mr-1 h-4 w-4" /> Add bracket
                </Button>
                <Button onClick={saveRates} disabled={savingRates}>
                  <Save className="mr-2 h-4 w-4" />
                  {savingRates ? "Saving…" : "Save shipping rates"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* RECOMPUTE EXISTING APPROVED PRODUCTS */}
          <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>Apply to existing products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Changing the rates above only affects products approved afterwards. Run this to
                re-apply the current shipping &amp; tax settings to the price of products that were
                <strong> already approved</strong> — useful right after adding shipping rates.
                It only updates prices; it never changes a product&apos;s approval status or whether
                it&apos;s listed, and it leaves pending products untouched.
              </p>
              <Button variant="outline" onClick={() => setRecomputeOpen(true)} disabled={recomputing}>
                <RefreshCw className={`mr-2 h-4 w-4${recomputing ? " animate-spin" : ""}`} />
                {recomputing ? "Recomputing…" : "Recompute approved product prices"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* PREVIEW */}
        <Card className="h-fit border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Sample base price" value={formatCurrency(SAMPLE)} />
            <Row label={`Profit (${p}%)`} value={`+ ${formatCurrency((SAMPLE * p) / 100)}`} />
            <Row label={`Tariffs (${t}%)`} value={`+ ${formatCurrency((SAMPLE * t) / 100)}`} />
            <Row label={`Shipping (${SAMPLE_KG}kg × ${formatCurrency(gKg)}/kg)`} value={`+ ${formatCurrency(sampleShip)}`} />
            <Separator />
            <Row label="Final price" value={formatCurrency(finalSample)} strong />
            <p className="pt-1 text-xs text-slate-400">
              Actual shipping = product weight × rate (special bracket or general), unless overridden.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recompute confirmation — changes live prices on already-approved products. */}
      <ConfirmDialog
        open={recomputeOpen}
        onOpenChange={(open) => !open && setRecomputeOpen(false)}
        title="Recompute approved product prices?"
        description="This re-applies the current shipping & tax settings to the final price of every already-approved product. Approval status, listing state, and pending products are not affected. Make sure your rates above are saved first."
        confirmLabel="Recompute prices"
        onConfirm={() => {
          setRecomputeOpen(false);
          recompute();
        }}
      />
    </DashboardShell>
  );
}

function PctField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Input type="number" min="0" step="0.01" value={value}
          onChange={(e) => onChange(e.target.value)} placeholder="0" className="pr-9" />
        <Percent className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={strong ? "text-base font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}
