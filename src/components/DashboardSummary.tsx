import {
  ArrowDownRight,
  ArrowUpRight,
  BadgePercent,
  Landmark,
  ListChecks,
} from "lucide-react";
import type { SummaryMetrics } from "../utils/aggregate";
import { formatKRW, formatPercent } from "../utils/format";

interface DashboardSummaryProps {
  metrics: SummaryMetrics | (Omit<SummaryMetrics, "transactionCount"> & { entryCount: number });
  countLabel?: string;
}

const CARDS = [
  {
    key: "income",
    label: "총수입",
    tone: "text-leaf",
    Icon: ArrowUpRight,
    value: (metrics: DashboardSummaryProps["metrics"]) => formatKRW(metrics.totalIncome),
  },
  {
    key: "expense",
    label: "총지출",
    tone: "text-amberline",
    Icon: ArrowDownRight,
    value: (metrics: DashboardSummaryProps["metrics"]) => formatKRW(metrics.totalExpense),
  },
  {
    key: "balance",
    label: "잔액",
    tone: "text-mintline",
    Icon: Landmark,
    value: (metrics: DashboardSummaryProps["metrics"]) => formatKRW(metrics.netAmount),
  },
  {
    key: "rate",
    label: "소비율",
    tone: "text-river",
    Icon: BadgePercent,
    value: (metrics: DashboardSummaryProps["metrics"]) => formatPercent(metrics.spendingRate),
  },
] as const;

export default function DashboardSummary({ metrics, countLabel = "거래 수" }: DashboardSummaryProps) {
  const count = "transactionCount" in metrics ? metrics.transactionCount : metrics.entryCount;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {CARDS.map(({ key, label, tone, Icon, value }) => (
        <article
          key={key}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-500">{label}</span>
            <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
          </div>
          <strong className="mt-3 block text-2xl font-semibold tracking-normal text-ink">
            {value(metrics)}
          </strong>
        </article>
      ))}

      <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-500">{countLabel}</span>
          <ListChecks className="h-5 w-5 text-slate-500" aria-hidden="true" />
        </div>
        <strong className="mt-3 block text-2xl font-semibold tracking-normal text-ink">
          {count.toLocaleString("ko-KR")}건
        </strong>
      </article>
    </section>
  );
}
