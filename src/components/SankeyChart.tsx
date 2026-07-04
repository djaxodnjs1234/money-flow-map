import { useEffect, useMemo, useRef } from "react";
import { SankeyChart as EChartsSankeyChart, type SankeySeriesOption } from "echarts/charts";
import {
  TitleComponent,
  type TitleComponentOption,
  TooltipComponent,
  type TooltipComponentOption,
} from "echarts/components";
import * as echarts from "echarts/core";
import type { ComposeOption, EChartsType } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { CATEGORY_COLORS } from "../constants/categories";
import type { SankeyData } from "../utils/sankeyTransform";
import { getSankeyNodeValues } from "../utils/sankeyTransform";
import { formatCompactKRW, formatKRW } from "../utils/format";

echarts.use([EChartsSankeyChart, TooltipComponent, TitleComponent, CanvasRenderer]);

export type SankeyOption = ComposeOption<
  SankeySeriesOption | TitleComponentOption | TooltipComponentOption
>;
export type SankeyNodePosition = {
  localX?: number;
  localY?: number;
};
export type SankeyLayoutPositions = Record<string, SankeyNodePosition>;

type TooltipParam = {
  dataType?: string;
  data?: { source?: string; target?: string; value?: number } | null;
  name?: string;
};

interface SankeyChartProps {
  data: SankeyData;
  height?: number;
  detailed?: boolean;
  layoutPositions?: SankeyLayoutPositions;
  onLayoutChange?: (positions: SankeyLayoutPositions) => void;
  title?: string;
}

interface CreateSankeyOptionInput {
  backgroundColor?: string;
  data: SankeyData;
  detailed: boolean;
  layoutPositions?: SankeyLayoutPositions;
  title?: string;
}

export default function SankeyChart({
  data,
  detailed = false,
  height = 560,
  layoutPositions,
  onLayoutChange,
  title,
}: SankeyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<EChartsType | null>(null);
  const onLayoutChangeRef = useRef(onLayoutChange);
  const dragSaveTimerRef = useRef<number | null>(null);
  const hasData = data.links.length > 0;
  const option = useMemo(
    () => createSankeyOption({ data, detailed, layoutPositions, title }),
    [data, detailed, layoutPositions, title],
  );

  useEffect(() => {
    onLayoutChangeRef.current = onLayoutChange;
  }, [onLayoutChange]);

  useEffect(() => {
    if (!hasData) {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
      return;
    }

    const element = chartRef.current;
    if (!element) return;

    const chart = echarts.getInstanceByDom(element) ?? echarts.init(element);
    chartInstanceRef.current = chart;

    const handleDragNode = () => {
      if (dragSaveTimerRef.current) {
        window.clearTimeout(dragSaveTimerRef.current);
      }

      const positions = extractLayoutPositions(chart);
      dragSaveTimerRef.current = window.setTimeout(() => {
        onLayoutChangeRef.current?.(positions);
      }, 120);
    };
    chart.on("dragnode", handleDragNode);

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(element);

    return () => {
      if (dragSaveTimerRef.current) {
        window.clearTimeout(dragSaveTimerRef.current);
        dragSaveTimerRef.current = null;
      }
      chart.off("dragnode", handleDragNode);
      resizeObserver.disconnect();
      chart.dispose();
      if (chartInstanceRef.current === chart) {
        chartInstanceRef.current = null;
      }
    };
  }, [hasData]);

  useEffect(() => {
    if (!hasData) return;

    const element = chartRef.current;
    if (!element) return;

    const chart = chartInstanceRef.current ?? echarts.getInstanceByDom(element) ?? echarts.init(element);
    chartInstanceRef.current = chart;
    chart.setOption(option, { notMerge: true, lazyUpdate: false });
    chart.resize();
  }, [hasData, option]);

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center text-slate-500"
        style={{ minHeight: height }}
      >
        선택한 기간에 표시할 흐름 데이터가 없습니다.
      </div>
    );
  }

  return <div ref={chartRef} style={{ height, minHeight: height, width: "100%" }} />;
}

export function createSankeyOption({
  backgroundColor = "transparent",
  data,
  detailed,
  layoutPositions,
  title,
}: CreateSankeyOptionInput): SankeyOption {
  const nodeValues = getSankeyNodeValues(data);
  const nodeMeta = new Map(data.nodes.map((node) => [node.name, node]));
  const maxNodeValue = Math.max(...Object.values(nodeValues), 1);
  const defaultPositions = getDefaultLayoutPositions(data, detailed);

  return {
    backgroundColor,
    animation: false,
    title: title
      ? {
          text: title,
          left: detailed ? 12 : 10,
          top: 10,
          textStyle: {
            color: "#172033",
            fontSize: detailed ? 16 : 17,
            fontWeight: 700,
            fontFamily:
              'Pretendard, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
        }
      : undefined,
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove",
      borderColor: "#dbe3ef",
      borderWidth: 1,
      padding: 12,
      textStyle: {
        color: "#172033",
        fontFamily:
          'Pretendard, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      formatter: (params: unknown) => {
        const item = (Array.isArray(params) ? params[0] : params) as TooltipParam;

        if (item.dataType === "edge" && item.data?.source && item.data?.target) {
          const source = displayNodeName(
            item.data.source,
            nodeMeta.get(item.data.source)?.displayName,
          );
          const target = displayNodeName(
            item.data.target,
            nodeMeta.get(item.data.target)?.displayName,
          );

          return `<strong>${source} → ${target}</strong><br/>${formatKRW(item.data.value ?? 0)}`;
        }

        const value = nodeValues[item.name ?? ""] ?? 0;
        const meta = item.name ? nodeMeta.get(item.name) : undefined;
        return `<strong>${displayNodeName(item.name ?? "", meta?.displayName)}</strong><br/>${formatKRW(value)}`;
      },
    },
    series: [
      {
        type: "sankey",
        top: title ? 78 : 30,
        right: 190,
        bottom: 30,
        left: 150,
        nodeWidth: 16,
        nodeGap: detailed ? 6 : 24,
        nodeAlign: "justify",
        layoutIterations: detailed ? 0 : 48,
        draggable: true,
        emphasis: {
          focus: "adjacency",
        },
        labelLayout: {
          moveOverlap: "shiftY",
          hideOverlap: false,
        },
        label: {
          color: "#172033",
          fontWeight: 700,
          fontSize: detailed ? 10 : 12,
          lineHeight: detailed ? 13 : 16,
          width: detailed ? 150 : 140,
          overflow: detailed ? "truncate" : "break",
        },
        lineStyle: {
          color: "gradient",
          opacity: detailed ? 0.42 : 0.46,
          curveness: 0.46,
        },
        itemStyle: {
          borderColor: "rgba(23, 32, 51, 0.28)",
          borderWidth: 0.5,
        },
        data: data.nodes.map((node) => {
          const value = nodeValues[node.name] ?? 0;
          const label = buildNodeLabel({
            depth: node.depth,
            detailed,
            displayName: node.displayName,
            maxNodeValue,
            nodeName: node.name,
            totalIncome: nodeValues["총수입"] ?? 0,
            value,
          });
          const defaultPosition = defaultPositions[node.name] ?? {};
          const savedPosition = layoutPositions?.[node.name];

          return {
            ...node,
            depth: node.depth,
            draggable: true,
            label,
            localX: savedPosition?.localX ?? defaultPosition.localX,
            localY: savedPosition?.localY ?? defaultPosition.localY,
            itemStyle: {
              color: CATEGORY_COLORS[node.category ?? node.name] ?? "#64748b",
            },
          };
        }),
        links: data.links.map((link) => ({
          ...link,
          lineStyle: {
            color:
              CATEGORY_COLORS[nodeMeta.get(link.source)?.category ?? link.source] ??
              CATEGORY_COLORS[nodeMeta.get(link.target)?.category ?? link.target] ??
              "#94a3b8",
          },
        })),
      },
    ],
  };
}

export function extractLayoutPositions(chart: EChartsType): SankeyLayoutPositions {
  const option = chart.getOption() as {
    series?: Array<{
      data?: Array<{ name?: string; localX?: number; localY?: number }>;
    }>;
  };
  const nodes = option.series?.[0]?.data ?? [];

  return nodes.reduce<SankeyLayoutPositions>((acc, node) => {
    if (!node.name) return acc;
    if (node.localX === undefined && node.localY === undefined) return acc;

    acc[node.name] = {
      localX: node.localX,
      localY: node.localY,
    };
    return acc;
  }, {});
}

function formatLabel(name: string) {
  return name.length > 12 ? name.replace("/", "/\n").replace(" ", "\n") : name;
}

function buildNodeLabel({
  depth,
  detailed,
  displayName,
  maxNodeValue,
  nodeName,
  totalIncome,
  value,
}: {
  depth?: number;
  detailed: boolean;
  displayName?: string;
  maxNodeValue: number;
  nodeName: string;
  totalIncome: number;
  value: number;
}) {
  const isTotalNode = ["총수입", "총지출", "순이익", "초과지출"].includes(nodeName);
  const isSubcategory = Boolean(displayName);
  const isDetailedCategory = detailed && !isTotalNode && !isSubcategory;
  const share = value / Math.max(maxNodeValue, 1);
  const fontSize = getNodeFontSize(share, detailed, isTotalNode);
  const overflow = detailed ? "truncate" : "break";
  const labelText = getNodeLabelText({
    depth,
    detailed,
    displayName,
    isTotalNode,
    nodeName,
    share,
    totalIncome,
    value,
  });

  return {
    color: getNodeLabelColor(share, isTotalNode),
    fontWeight: isTotalNode || share >= 0.08 ? 700 : 500,
    fontSize,
    lineHeight: isTotalNode ? fontSize + 5 : fontSize + 3,
    width: getNodeLabelWidth(detailed, isTotalNode, isDetailedCategory, share),
    position: getNodeLabelPosition(depth, isTotalNode),
    align: isTotalNode ? ("center" as const) : undefined,
    overflow: overflow as "truncate" | "break",
    backgroundColor: isTotalNode
      ? getTotalLabelBackground(nodeName)
      : isDetailedCategory
        ? "rgba(255, 255, 255, 0.72)"
        : undefined,
    borderColor: isTotalNode ? getTotalLabelBorder(nodeName) : undefined,
    borderWidth: isTotalNode ? 1 : 0,
    borderRadius: isTotalNode ? 6 : isDetailedCategory ? 4 : 0,
    padding: isTotalNode ? [6, 8] : isDetailedCategory ? [2, 4] : 0,
    formatter: () => labelText,
  };
}

function getNodeLabelText({
  depth,
  detailed,
  displayName,
  isTotalNode,
  nodeName,
  share,
  totalIncome,
  value,
}: {
  depth?: number;
  detailed: boolean;
  displayName?: string;
  isTotalNode: boolean;
  nodeName: string;
  share: number;
  totalIncome: number;
  value: number;
}) {
  const name = displayNodeName(nodeName, displayName);

  if (nodeName === "순이익") {
    const profitRate = totalIncome > 0 ? Math.round((value / totalIncome) * 100) : 0;
    return `순이익\n${formatCompactKRW(value)}\n총수익의 ${profitRate}%`;
  }

  if (isTotalNode) {
    return `${name}\n${formatCompactKRW(value)}`;
  }

  if (detailed) {
    return `${name} ${formatCompactKRW(value)}`;
  }

  if (depth === 0) {
    return `${name} ${formatCompactKRW(value)}`;
  }

  if (share < 0.035) {
    return `${name} ${formatCompactKRW(value)}`;
  }

  return `${formatLabel(name)}\n${formatCompactKRW(value)}`;
}

function displayNodeName(nodeName: string, displayName?: string) {
  if (nodeName === "총수입") return "총수익";
  if (nodeName === "잔액") return "순이익";
  return displayName ?? nodeName;
}

function getNodeFontSize(share: number, detailed: boolean, isTotalNode: boolean) {
  if (isTotalNode) return detailed ? 14 : 16;
  if (share >= 0.25) return detailed ? 14 : 15;
  if (share >= 0.08) return detailed ? 12 : 13;
  if (share >= 0.025) return detailed ? 10 : 11;
  if (share >= 0.008) return detailed ? 8 : 9;
  return detailed ? 7 : 8;
}

function getNodeLabelColor(share: number, isTotalNode: boolean) {
  if (isTotalNode) return "#172033";
  if (share >= 0.08) return "#243044";
  if (share >= 0.025) return "#64748b";
  return "#94a3b8";
}

function getNodeLabelWidth(
  detailed: boolean,
  isTotalNode: boolean,
  isDetailedCategory: boolean,
  share: number,
) {
  if (isTotalNode || isDetailedCategory) return undefined;
  if (detailed) return share >= 0.08 ? 130 : 118;
  return share >= 0.08 ? 132 : 118;
}

function getNodeLabelPosition(
  depth: number | undefined,
  isTotalNode: boolean,
): "inside" | "left" | "right" | undefined {
  if (isTotalNode) return "inside";
  if (depth === 0) return "left";
  if (depth !== undefined && depth > 0) return "right";
  return undefined;
}

function getDefaultLayoutPositions(
  data: SankeyData,
  detailed: boolean,
): SankeyLayoutPositions {
  const positions: SankeyLayoutPositions = {};
  const nodeMeta = new Map(data.nodes.map((node) => [node.name, node]));
  const x = detailed
    ? getHorizontalLayout(true)
    : getHorizontalLayout(false);
  const incomeSourceLinks = data.links.filter((link) => link.target === "총수입");
  const expenseCategoryLinks = data.links.filter((link) => link.source === "총지출");
  const expenseCategories = expenseCategoryLinks
    .map((link) => link.target)
    .filter((name) => nodeMeta.has(name));
  const incomeSourceYs = stackPositionsByValue(
    incomeSourceLinks.map((link) => ({
      name: link.source,
      value: link.value,
    })),
    {
      end: 0.94,
      gap: 0.04,
      start: 0.05,
    },
  );
  const categoryYs = stackPositionsByValue(
    expenseCategoryLinks.map((link) => ({
      name: link.target,
      value: link.value,
    })),
    {
      end: 0.9,
      gap: detailed ? 0.028 : 0.035,
      start: 0.03,
    },
  );

  setPosition(positions, nodeMeta, "총수입", x.totalIncome, 0.06);
  setPosition(positions, nodeMeta, "총지출", x.split, 0.04);
  setPosition(positions, nodeMeta, "순이익", x.split, 0.58);
  setPosition(positions, nodeMeta, "초과지출", x.totalIncome, 0.04);

  incomeSourceLinks.forEach((link) => {
    setPosition(positions, nodeMeta, link.source, x.incomeSource, incomeSourceYs[link.source]);
  });

  expenseCategories.forEach((category) => {
    setPosition(positions, nodeMeta, category, x.expenseCategory, categoryYs[category]);
  });

  if (detailed) {
    const subcategoryLinks = expenseCategories.flatMap((category) =>
      data.links
        .filter((link) => link.source === category)
        .map((link) => ({
          group: category,
          name: link.target,
          value: link.value,
        })),
    );
    const subcategoryYs = stackPositionsByValue(subcategoryLinks, {
      end: 0.95,
      gap: 0.016,
      groupGap: 0.032,
      start: 0.035,
    });

    subcategoryLinks.forEach((link) => {
      setPosition(positions, nodeMeta, link.name, x.expenseSubcategory, subcategoryYs[link.name]);
    });
  }

  return positions;
}

function getHorizontalLayout(detailed: boolean) {
  return {
    incomeSource: 0.02,
    totalIncome: 0.28,
    split: 0.54,
    expenseCategory: 0.74,
    expenseSubcategory: detailed ? 0.92 : 0.92,
  };
}

function setPosition(
  positions: SankeyLayoutPositions,
  nodeMeta: Map<string, SankeyData["nodes"][number]>,
  nodeName: string,
  localX: number,
  localY: number,
) {
  if (!nodeMeta.has(nodeName)) return;
  positions[nodeName] = {
    localX: clamp(localX, 0, 0.96),
    localY: clamp(localY, 0, 0.96),
  };
}

function stackPositionsByValue(
  items: Array<{ name: string; value: number; group?: string }>,
  {
    end,
    gap,
    groupGap = gap,
    start,
  }: {
    end: number;
    gap: number;
    groupGap?: number;
    start: number;
  },
) {
  const positions: Record<string, number> = {};
  const totalValue = items.reduce((sum, item) => sum + Math.max(item.value, 0), 0);

  if (items.length === 0) return positions;
  if (items.length === 1 || totalValue <= 0) {
    positions[items[0].name] = start;
    return positions;
  }

  const desiredGaps = items.slice(1).map((item, index) => {
    const previous = items[index];
    return item.group !== undefined && item.group !== previous.group ? groupGap : gap;
  });
  const range = Math.max(end - start, 0.01);
  const desiredGapTotal = desiredGaps.reduce((sum, value) => sum + value, 0);
  const gapScale =
    desiredGapTotal > 0 ? Math.min(1, (range * 0.62) / desiredGapTotal) : 1;
  const gaps = desiredGaps.map((value) => value * gapScale);
  const gapTotal = gaps.reduce((sum, value) => sum + value, 0);
  const valueRange = Math.max(range - gapTotal, range * 0.22);
  const valueScale = valueRange / totalValue;
  let cursor = start;

  items.forEach((item, index) => {
    positions[item.name] = clamp(cursor, start, end);
    cursor += Math.max(item.value, 0) * valueScale + (gaps[index] ?? 0);
  });

  return positions;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTotalLabelBackground(nodeName: string) {
  if (nodeName === "초과지출") return "rgba(148, 163, 184, 0.24)";
  return "rgba(100, 116, 139, 0.16)";
}

function getTotalLabelBorder(nodeName: string) {
  if (nodeName === "초과지출") return "rgba(100, 116, 139, 0.28)";
  return "rgba(71, 85, 105, 0.18)";
}
