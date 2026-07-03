import {
  ArrowDownRight,
  ArrowUpRight,
  BadgePercent,
  ListChecks,
} from "lucide-react";
import { formatCompactKRW, formatKRW, formatPercent } from "../utils/format";

interface DashboardSummaryProps {
  metrics: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    entryCount?: number;
    transactionCount?: number;
  };
  countLabel?: string;
  topIncome?: Array<{ label: string; value: number }>;
}

export default function DashboardSummary({
  countLabel = "거래 수",
  metrics,
  topIncome = [],
}: DashboardSummaryProps) {
  const count = metrics.transactionCount ?? metrics.entryCount ?? 0;
  const profitRate =
    metrics.totalIncome > 0
      ? Math.round((metrics.netAmount / metrics.totalIncome) * 100)
      : 0;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        label="총수익"
        value={formatCompactKRW(metrics.totalIncome)}
        detail={formatKRW(metrics.totalIncome)}
        tone="income"
        Icon={ArrowUpRight}
      />
      <MetricCard
        label="총지출"
        value={formatCompactKRW(metrics.totalExpense)}
        detail={formatKRW(metrics.totalExpense)}
        tone="expense"
        Icon={ArrowDownRight}
      />
      <MetricCard
        label="순이익"
        value={formatCompactKRW(metrics.netAmount)}
        detail={`총수익의 ${formatPercent(profitRate)}`}
        tone="profit"
        Icon={BadgePercent}
      />

      <article className="min-h-32 rounded-md border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-500">수익 Top 3</span>
          <ListChecks className="h-5 w-5 text-river" aria-hidden="true" />
        </div>
        <div className="mt-3 space-y-2">
          {topIncome.length > 0 ? (
            topIncome.map((item, index) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-slate-600">
                  {index + 1}. {item.label}
                </span>
                <strong className="shrink-0 font-semibold text-ink">
                  {formatCompactKRW(item.value)}
                </strong>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">수익 입력 없음</p>
          )}
        </div>
      </article>

      <article className="min-h-32 rounded-md border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-500">{countLabel}</span>
          <ListChecks className="h-5 w-5 text-slate-500" aria-hidden="true" />
        </div>
        <strong className="mt-3 block text-3xl font-semibold tracking-normal text-ink">
          {count.toLocaleString("ko-KR")}건
        </strong>
      </article>
    </section>
  );
}

function MetricCard({
  detail,
  Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  Icon: typeof ArrowUpRight;
  label: string;
  tone: "income" | "expense" | "profit";
  value: string;
}) {
  const toneClass = {
    income: "border-leaf/25 bg-leaf/10 text-leaf",
    expense: "border-amberline/25 bg-amberline/10 text-amberline",
    profit: "border-mintline/30 bg-mintline/15 text-mintline",
  }[tone];

  return (
    <article className={`min-h-32 rounded-md border p-4 shadow-soft ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <strong className="mt-3 block break-words text-3xl font-semibold tracking-normal text-ink">
        {value}
      </strong>
      <span className="mt-2 block break-words text-sm font-medium text-slate-600">
        {detail}
      </span>
    </article>
  );
}
