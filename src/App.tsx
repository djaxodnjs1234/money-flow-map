import { BarChart3, List, PencilLine, WalletCards } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useAssetBoardsStore } from "./store/assetBoardsStore";
import { useFlowEntriesStore } from "./store/flowEntriesStore";
import { getFlowSummaryMetrics } from "./utils/flowAggregate";
import { formatCompactKRW } from "./utils/format";

type Page = "home" | "dashboard" | "input";
type BoardPage = Exclude<Page, "home">;
type AppRoute = { page: "home" } | { page: BoardPage; boardId: string };

const AssetBoardsPage = lazy(() => import("./pages/AssetBoardsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const InputPage = lazy(() => import("./pages/InputPage"));

const NAV_ITEMS: Array<{ page: BoardPage; label: string; Icon: typeof BarChart3 }> = [
  { page: "dashboard", label: "대시보드", Icon: BarChart3 },
  { page: "input", label: "입력", Icon: PencilLine },
];

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute());
  const boards = useAssetBoardsStore((state) => state.boards);
  const entries = useFlowEntriesStore((state) => state.entries);
  const setActiveBoardId = useFlowEntriesStore((state) => state.setActiveBoardId);
  const metrics = useMemo(() => getFlowSummaryMetrics(entries), [entries]);
  const activeBoard = useMemo(
    () => (route.page === "home" ? null : boards.find((board) => board.id === route.boardId) ?? null),
    [boards, route],
  );

  useEffect(() => {
    const handleHashChange = () => setRoute(parseRoute());

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (route.page !== "home") {
      setActiveBoardId(route.boardId);
    }
  }, [route, setActiveBoardId]);

  useEffect(() => {
    if (route.page !== "home" && !activeBoard) {
      navigateHome();
    }
  }, [activeBoard, route]);

  function openBoard(boardId: string, page: BoardPage = "dashboard") {
    updateRoute({ page, boardId });
  }

  function navigateBoardPage(page: BoardPage) {
    if (route.page === "home") return;
    updateRoute({ page, boardId: route.boardId });
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-white shadow-soft">
              <WalletCards className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-semibold tracking-normal text-ink">
                {activeBoard?.title ?? "Money Flow Map"}
              </p>
              <p className="text-sm text-slate-500">
                {activeBoard
                  ? `총 ${entries.length.toLocaleString("ko-KR")}개 입력 · 누적 잔액 ${formatCompactKRW(
                      metrics.netAmount,
                    )}`
                  : `${boards.length.toLocaleString("ko-KR")}개 자산관리 목록`}
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {activeBoard && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                onClick={navigateHome}
              >
                <List className="h-4 w-4" aria-hidden="true" />
                목록
              </button>
            )}
            {activeBoard &&
              NAV_ITEMS.map(({ page: itemPage, label, Icon }) => (
                <button
                  key={itemPage}
                  type="button"
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                    route.page === itemPage
                      ? "bg-ink text-white shadow-soft"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  onClick={() => navigateBoardPage(itemPage)}
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
          {route.page === "home" && <AssetBoardsPage onOpenBoard={openBoard} />}
          {route.page === "dashboard" && activeBoard && (
            <DashboardPage board={activeBoard} />
          )}
          {route.page === "input" && activeBoard && <InputPage board={activeBoard} />}
        </Suspense>
      </main>
    </div>
  );
}

function parseRoute(): AppRoute {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [section, boardId, page] = hash.split("/");

  if (section === "board" && boardId) {
    return {
      page: page === "input" ? "input" : "dashboard",
      boardId: decodeURIComponent(boardId),
    };
  }

  return { page: "home" };
}

function updateRoute(route: AppRoute) {
  if (route.page === "home") {
    navigateHome();
    return;
  }

  window.location.hash = `/board/${encodeURIComponent(route.boardId)}/${route.page}`;
}

function navigateHome() {
  window.location.hash = "/";
}
