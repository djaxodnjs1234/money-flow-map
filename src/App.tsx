import { BarChart3, PencilLine, WalletCards } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { useFlowEntriesStore } from "./store/flowEntriesStore";
import { getFlowSummaryMetrics } from "./utils/flowAggregate";
import { formatCompactKRW } from "./utils/format";

type Page = "dashboard" | "input";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const InputPage = lazy(() => import("./pages/InputPage"));

const NAV_ITEMS: Array<{ page: Page; label: string; Icon: typeof BarChart3 }> = [
  { page: "dashboard", label: "대시보드", Icon: BarChart3 },
  { page: "input", label: "입력", Icon: PencilLine },
];

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const entries = useFlowEntriesStore((state) => state.entries);
  const metrics = useMemo(() => getFlowSummaryMetrics(entries), [entries]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-white shadow-soft">
              <WalletCards className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-semibold tracking-normal text-ink">Money Flow Map</p>
              <p className="text-sm text-slate-500">
                총 {entries.length.toLocaleString("ko-KR")}개 입력 · 누적 잔액{" "}
                {formatCompactKRW(metrics.netAmount)}
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {NAV_ITEMS.map(({ page: itemPage, label, Icon }) => (
              <button
                key={itemPage}
                type="button"
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  page === itemPage
                    ? "bg-ink text-white shadow-soft"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setPage(itemPage)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-6">
        <Suspense
          fallback={
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm font-medium text-slate-500 shadow-soft">
              화면을 불러오는 중입니다.
            </div>
          }
        >
          {page === "dashboard" && <DashboardPage />}
          {page === "input" && <InputPage />}
        </Suspense>
      </main>
    </div>
  );
}
