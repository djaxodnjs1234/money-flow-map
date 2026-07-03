import { useMemo, useState } from "react";
import { Database, Layers3, RotateCcw } from "lucide-react";
import CategorySummary from "../components/CategorySummary";
import DashboardSummary from "../components/DashboardSummary";
import SankeyChart from "../components/SankeyChart";
import { useFlowEntriesStore } from "../store/flowEntriesStore";
import type { AssetBoard } from "../types/assetBoard";
import {
  aggregateFlowByCategory,
  filterFlowEntriesByPeriod,
  getFlowPeriodLabel,
  getFlowSummaryMetrics,
  transformFlowToSankeyData,
} from "../utils/flowAggregate";
import { formatCompactKRW } from "../utils/format";

interface DashboardPageProps {
  board: AssetBoard;
}

export default function DashboardPage({ board }: DashboardPageProps) {
  const { entries, resetToSample } = useFlowEntriesStore();
  const [showSubcategories, setShowSubcategories] = useState(false);

  const filteredEntries = useMemo(
    () => filterFlowEntriesByPeriod(entries, board.period),
    [board.period, entries],
  );
  const metrics = useMemo(() => getFlowSummaryMetrics(filteredEntries), [filteredEntries]);
  const sankeyData = useMemo(
    () => transformFlowToSankeyData(filteredEntries, { showSubcategories }),
    [filteredEntries, showSubcategories],
  );
  const incomeTotals = useMemo(
    () => aggregateFlowByCategory(filteredEntries, "income"),
    [filteredEntries],
  );
  const topIncome = useMemo(
    () =>
      Object.entries(incomeTotals)
        .sort(([, amountA], [, amountB]) => amountB - amountA)
        .slice(0, 3)
        .map(([label, value]) => ({ label, value })),
    [incomeTotals],
  );
  const expenseTotals = useMemo(
    () => aggregateFlowByCategory(filteredEntries, "expense"),
    [filteredEntries],
  );
  const topExpense = useMemo(
    () =>
      Object.entries(expenseTotals)
        .sort(([, amountA], [, amountB]) => amountB - amountA)
        .slice(0, 3)
        .map(([label, value]) => ({ label, value })),
    [expenseTotals],
  );
  const chartHeight = showSubcategories
    ? Math.max(920, Math.min(1320, 720 + sankeyData.nodes.length * 14))
    : Math.max(700, Math.min(900, 580 + sankeyData.nodes.length * 18));

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(71,85,105,0.68))] p-6 text-white shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white/70">{board.title}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal lg:text-4xl">
              {getFlowPeriodLabel(board.period)}
            </h1>
            <p className="mt-3 text-sm font-medium text-white/70">
              순이익 {formatCompactKRW(metrics.netAmount)} · {filteredEntries.length.toLocaleString("ko-KR")}개 입력
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            onClick={() => resetToSample(board.period)}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            샘플 복원
          </button>
        </div>
      </section>

      <DashboardSummary metrics={metrics} topExpense={topExpense} topIncome={topIncome} />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">자금흐름 Sankey</h2>
            <p className="mt-1 text-sm text-slate-500">
              {showSubcategories
                ? "소분류 → 대분류 → 총수익/총지출 → 대분류 → 소분류"
                : "수입 대분류 → 총수익 → 총지출/순이익 → 지출 대분류"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                showSubcategories
                  ? "border-river bg-river text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setShowSubcategories((value) => !value)}
            >
              <Layers3 className="h-4 w-4" aria-hidden="true" />
              소분류 표시
            </button>
            <div className="inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
              <Database className="h-4 w-4 text-river" aria-hidden="true" />
              {filteredEntries.length.toLocaleString("ko-KR")}개
            </div>
          </div>
        </div>
        <div className="overflow-x-auto bg-white px-2 py-3">
          <div className={showSubcategories ? "min-w-[1180px]" : "min-w-[980px]"}>
            <SankeyChart data={sankeyData} height={chartHeight} detailed={showSubcategories} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <CategorySummary
          title="수입 항목 합계"
          totals={incomeTotals}
          emptyText="선택한 기간에 수입 입력이 없습니다."
        />
        <CategorySummary
          title="지출 대분류 합계"
          totals={expenseTotals}
          emptyText="선택한 기간에 지출 입력이 없습니다."
        />
      </div>
    </div>
  );
}
