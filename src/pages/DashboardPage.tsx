import { useMemo, useState } from "react";
import { Database, Layers3, RotateCcw } from "lucide-react";
import CategorySummary from "../components/CategorySummary";
import DashboardSummary from "../components/DashboardSummary";
import FlowPeriodFilter from "../components/FlowPeriodFilter";
import SankeyChart from "../components/SankeyChart";
import { useFlowEntriesStore } from "../store/flowEntriesStore";
import type { AssetBoard } from "../types/assetBoard";
import type { FlowPeriodSelection } from "../types/flow";
import {
  aggregateFlowByCategory,
  filterFlowEntriesByPeriod,
  getAvailableFlowYears,
  getFlowPeriodLabel,
  getFlowSummaryMetrics,
  transformFlowToSankeyData,
} from "../utils/flowAggregate";

interface DashboardPageProps {
  board: AssetBoard;
}

export default function DashboardPage({ board }: DashboardPageProps) {
  const { entries, resetToSample } = useFlowEntriesStore();
  const [period, setPeriod] = useState<FlowPeriodSelection>({
    periodType: "quarter",
    year: 2026,
    quarter: 3,
  });
  const [showSubcategories, setShowSubcategories] = useState(false);

  const years = useMemo(() => getAvailableFlowYears(entries), [entries]);
  const filteredEntries = useMemo(
    () => filterFlowEntriesByPeriod(entries, period),
    [entries, period],
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
  const expenseTotals = useMemo(
    () => aggregateFlowByCategory(filteredEntries, "expense"),
    [filteredEntries],
  );
  const chartHeight = showSubcategories
    ? Math.max(940, Math.min(1320, 520 + sankeyData.nodes.length * 28))
    : 620;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-river">{board.title}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-ink">
            {getFlowPeriodLabel(period)}
          </h1>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft transition hover:bg-slate-50"
          onClick={resetToSample}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          샘플 복원
        </button>
      </div>

      <FlowPeriodFilter value={period} years={years} onChange={setPeriod} />
      <DashboardSummary metrics={metrics} countLabel="대분류 수" />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">자금흐름 Sankey</h2>
            <p className="mt-1 text-sm text-slate-500">
              {showSubcategories
                ? "소분류 → 대분류 → 총수입/총지출 → 대분류 → 소분류"
                : "수입 대분류 → 총수입 → 총지출/잔액 → 지출 대분류"}
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
        <div className="bg-white px-2 py-3">
          <SankeyChart data={sankeyData} height={chartHeight} detailed={showSubcategories} />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <CategorySummary
          title="수입 대분류 합계"
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
