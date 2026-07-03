import { ArrowDownRight, ArrowUpRight, BadgePercent, ListChecks } from "lucide-react";
import { formatCompactKRW, formatPercent } from "../utils/format";

interface DashboardSummaryProps {
  metrics: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    entryCount?: number;
    transactionCount?: number;
  };
  topExpense?: Array<{ label: string; value: number }>;
  topIncome?: Array<{ label: string; value: number }>;
}

export default function DashboardSummary({
  metrics,
  topExpense = [],
  topIncome = [],
}: DashboardSummaryProps) {
  const count = metrics.transactionCount ?? metrics.entryCount ?? 0;
  const profitRate =
    metrics.totalIncome > 0
      ? Math.round((metrics.netAmount / metrics.totalIncome) * 100)
      : 0;

  return (
    <section className="rounded-lg bg-slate-500/10 p-4 shadow-soft ring-1 ring-slate-900/5 backdrop-blur">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.8fr_0.8fr]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock
            label="총수익"
            value={formatCompactKRW(metrics.totalIncome)}
            detail="수입 합계"
            Icon={ArrowUpRight}
          />
          <StatBlock
            label="총지출"
            value={formatCompactKRW(metrics.totalExpense)}
            detail="지출 합계"
            Icon={ArrowDownRight}
          />
          <StatBlock
            label="순이익"
            value={formatCompactKRW(metrics.netAmount)}
            detail={`총수익의 ${formatPercent(profitRate)}`}
            Icon={BadgePercent}
          />
          <StatBlock
            label="입력 건수"
            value={`${count.toLocaleString("ko-KR")}건`}
            detail="저장됨"
            Icon={ListChecks}
          />
        </div>

        <TopList title="수입 TOP 3" items={topIncome} emptyText="수입 없음" />
        <TopList title="지출 TOP 3" items={topExpense} emptyText="지출 없음" />
      </div>
    </section>
  );
}

function StatBlock({
  detail,
  Icon,
  label,
  value,
}: {
  detail: string;
  Icon: typeof ArrowUpRight;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 py-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <strong className="mt-2 block break-words text-2xl font-semibold tracking-normal text-ink">
        {value}
      </strong>
      <span className="mt-1 block text-xs font-medium text-slate-500">{detail}</span>
    </div>
  );
}

function TopList({
  emptyText,
  items,
  title,
}: {
  emptyText: string;
  items: Array<{ label: string; value: number }>;
  title: string;
}) {
  return (
    <article className="rounded-md border border-slate-500/15 bg-slate-700/[0.06] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <ListChecks className="h-4 w-4 text-slate-500" aria-hidden="true" />
      </div>

      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <li key={item.label} className="min-w-0 text-sm">
              <span className="block truncate font-medium text-slate-600">
                {index + 1}. {item.label}
              </span>
              <strong className="mt-1 block truncate font-semibold text-ink">
                {formatCompactKRW(item.value)}
              </strong>
            </li>
          ))
        ) : (
          <li className="col-span-3 text-sm text-slate-400">{emptyText}</li>
        )}
      </ol>
    </article>
  );
}
