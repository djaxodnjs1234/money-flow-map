import { useMemo, useState } from "react";
import * as echarts from "echarts/core";
import JSZip from "jszip";
import { Database, Download, Layers3, RotateCcw } from "lucide-react";
import CategorySummary from "../components/CategorySummary";
import DashboardSummary from "../components/DashboardSummary";
import SankeyChart, {
  createSankeyOption,
  type SankeyLayoutPositions,
} from "../components/SankeyChart";
import { useFlowEntriesStore } from "../store/flowEntriesStore";
import { useSankeyLayoutStore } from "../store/sankeyLayoutStore";
import type { AssetBoard } from "../types/assetBoard";
import {
  aggregateFlowByCategory,
  filterFlowEntriesByPeriod,
  getFlowPeriodLabel,
  getFlowSummaryMetrics,
  transformFlowToSankeyData,
} from "../utils/flowAggregate";
import { formatCompactKRW } from "../utils/format";
import type { SankeyData } from "../utils/sankeyTransform";

interface DashboardPageProps {
  board: AssetBoard;
}

const EMPTY_LAYOUT: SankeyLayoutPositions = {};

export default function DashboardPage({ board }: DashboardPageProps) {
  const { entries, resetToSample } = useFlowEntriesStore();
  const boardLayouts = useSankeyLayoutStore((state) => state.layoutsByBoardId[board.id]);
  const setSankeyLayout = useSankeyLayoutStore((state) => state.setLayout);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const diagramTitle = `${board.title} · ${getFlowPeriodLabel(board.period)}`;

  const filteredEntries = useMemo(
    () => filterFlowEntriesByPeriod(entries, board.period),
    [board.period, entries],
  );
  const metrics = useMemo(() => getFlowSummaryMetrics(filteredEntries), [filteredEntries]);
  const basicSankeyData = useMemo(
    () => transformFlowToSankeyData(filteredEntries, { showSubcategories: false }),
    [filteredEntries],
  );
  const detailedSankeyData = useMemo(
    () => transformFlowToSankeyData(filteredEntries, { showSubcategories: true }),
    [filteredEntries],
  );
  const sankeyData = showSubcategories ? detailedSankeyData : basicSankeyData;
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
    ? getChartHeight(detailedSankeyData, true)
    : getChartHeight(basicSankeyData, false);
  const basicLayout = boardLayouts?.basic ?? EMPTY_LAYOUT;
  const detailedLayout = useMemo(
    () => ({
      ...(boardLayouts?.detailed ?? EMPTY_LAYOUT),
      ...basicLayout,
    }),
    [basicLayout, boardLayouts?.detailed],
  );
  const activeLayout = showSubcategories ? detailedLayout : basicLayout;

  async function handleDownloadDiagramZip() {
    if (basicSankeyData.links.length === 0) return;

    setIsExporting(true);
    try {
      const zip = new JSZip();
      const safeName = toSafeFilename(`${board.title}-${getFlowPeriodLabel(board.period)}`);
      const basicImage = await renderSankeyImage({
        data: basicSankeyData,
        detailed: false,
        height: getChartHeight(basicSankeyData, false),
        layoutPositions: basicLayout,
        title: diagramTitle,
      });
      const detailedImage = await renderSankeyImage({
        data: detailedSankeyData,
        detailed: true,
        height: getChartHeight(detailedSankeyData, true),
        layoutPositions: detailedLayout,
        title: diagramTitle,
      });
      const databaseBackup = {
        app: "money-flow-map",
        version: 1,
        exportedAt: new Date().toISOString(),
        board,
        entries,
      };

      zip.file(`${safeName}-소분류-표시없음.png`, basicImage);
      zip.file(`${safeName}-소분류-표시.png`, detailedImage);
      zip.file(`${safeName}-db.json`, JSON.stringify(databaseBackup, null, 2));
      downloadBlob(await zip.generateAsync({ type: "blob" }), `${safeName}-diagram-package.zip`);
    } finally {
      setIsExporting(false);
    }
  }

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
            <h2 className="text-lg font-semibold text-ink">{diagramTitle}</h2>
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
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-wait disabled:text-slate-300"
              disabled={isExporting || basicSankeyData.links.length === 0}
              onClick={handleDownloadDiagramZip}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isExporting ? "생성 중" : "이미지 ZIP"}
            </button>
            <div className="inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
              <Database className="h-4 w-4 text-river" aria-hidden="true" />
              {filteredEntries.length.toLocaleString("ko-KR")}개
            </div>
          </div>
        </div>
        <div className="overflow-x-auto bg-white px-2 py-3">
          <div className={showSubcategories ? "min-w-[1320px]" : "min-w-[1080px]"}>
            <SankeyChart
              data={sankeyData}
              height={chartHeight}
              detailed={showSubcategories}
              layoutPositions={activeLayout}
              title={diagramTitle}
              onLayoutChange={(positions) =>
                setSankeyLayout(board.id, showSubcategories ? "detailed" : "basic", positions)
              }
            />
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

function getChartHeight(data: SankeyData, detailed: boolean) {
  if (detailed) {
    return Math.max(860, Math.min(1120, 720 + data.nodes.length * 12));
  }

  return Math.max(700, Math.min(840, 620 + data.nodes.length * 8));
}

async function renderSankeyImage({
  data,
  detailed,
  height,
  layoutPositions,
  title,
}: {
  data: SankeyData;
  detailed: boolean;
  height: number;
  layoutPositions: SankeyLayoutPositions;
  title: string;
}) {
  const width = detailed ? 1700 : 1450;
  const container = document.createElement("div");

  Object.assign(container.style, {
    background: "#ffffff",
    height: `${height}px`,
    left: "-10000px",
    pointerEvents: "none",
    position: "fixed",
    top: "0",
    width: `${width}px`,
  });
  document.body.appendChild(container);

  const chart = echarts.init(container, undefined, {
    renderer: "canvas",
    height,
    width,
  });

  try {
    chart.setOption(
      createSankeyOption({
        backgroundColor: "#ffffff",
        data,
        detailed,
        layoutPositions,
        title,
      }),
      { notMerge: true, lazyUpdate: false },
    );
    await waitForAnimationFrame();
    await waitForAnimationFrame();

    const dataUrl = chart.getDataURL({
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      type: "png",
    });
    return await dataUrlToBlob(dataUrl);
  } finally {
    chart.dispose();
    container.remove();
  }
}

async function dataUrlToBlob(dataUrl: string) {
  return await (await fetch(dataUrl)).blob();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function toSafeFilename(value: string) {
  return (
    value
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "money-flow"
  );
}
