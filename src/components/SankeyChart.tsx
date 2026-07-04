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
  detailData?: SankeyData;
  height?: number;
  detailed?: boolean;
  layoutPositions?: SankeyLayoutPositions;
  onLayoutChange?: (positions: SankeyLayoutPositions) => void;
  title?: string;
}

interface CreateSankeyOptionInput {
  backgroundColor?: string;
  data: SankeyData;
  detailData?: SankeyData;
  detailed: boolean;
  layoutPositions?: SankeyLayoutPositions;
  title?: string;
}

export default function SankeyChart({
  data,
  detailData,
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
    () => createSankeyOption({ data, detailData, detailed, layoutPositions, title }),
    [data, detailData, detailed, layoutPositions, title],
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
  detailData,
  detailed,
  layoutPositions,
  title,
}: CreateSankeyOptionInput): SankeyOption {
  const nodeValues = getSankeyNodeValues(data);
  const nodeMeta = new Map(data.nodes.map((node) => [node.name, node]));
  const maxNodeValue = Math.max(...Object.values(nodeValues), 1);
  const defaultPositions = getDefaultLayoutPositions(data, false);
  const detailDefaultPositions = detailData
    ? getDefaultLayoutPositions(detailData, true)
    : undefined;
  const series: SankeySeriesOption[] = [
    {
      type: "sankey",
      top: title ? 78 : 30,
      right: 190,
      bottom: 30,
      left: 150,
      nodeWidth: 16,
      nodeGap: 24,
      nodeAlign: "justify",
      layoutIterations: 0,
      z: 3,
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
        fontSize: 12,
        lineHeight: 16,
        width: 140,
        overflow: "break",
      },
      lineStyle: {
        color: "gradient",
        opacity: 0.46,
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
        const forceIncomeSourcePosition = isIncomeSourceNode(node.name, data);

        return {
          ...node,
          depth: node.depth,
          draggable: true,
          label,
          localX: forceIncomeSourcePosition
            ? defaultPosition.localX
            : savedPosition?.localX ?? defaultPosition.localX,
          localY: forceIncomeSourcePosition
            ? defaultPosition.localY
            : savedPosition?.localY ?? defaultPosition.localY,
          itemStyle: {
            color: CATEGORY_COLORS[node.category ?? node.name] ?? "#64748b",
          },
        };
      }),
      links: orderSankeyLinks(data.links, nodeValues).map((link) => ({
        ...link,
        lineStyle: {
          color:
            CATEGORY_COLORS[nodeMeta.get(link.source)?.category ?? link.source] ??
            CATEGORY_COLORS[nodeMeta.get(link.target)?.category ?? link.target] ??
            "#94a3b8",
        },
      })),
    },
  ];

  if (detailed && detailData && detailDefaultPositions) {
    series.push(
      createSubcategoryOverlaySeries({
        baseData: data,
        baseDefaultPositions: defaultPositions,
        detailData,
        detailDefaultPositions,
        layoutPositions,
        maxNodeValue,
        totalIncome: nodeValues["총수입"] ?? 0,
      }),
    );
  }

  return {
    backgroundColor,
    animation: false,
    title: title
      ? {
          text: title,
          left: 10,
          top: 10,
          textStyle: {
            color: "#172033",
            fontSize: 17,
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
    series,
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

function createSubcategoryOverlaySeries({
  baseData,
  baseDefaultPositions,
  detailData,
  detailDefaultPositions,
  layoutPositions,
  maxNodeValue,
  totalIncome,
}: {
  baseData: SankeyData;
  baseDefaultPositions: SankeyLayoutPositions;
  detailData: SankeyData;
  detailDefaultPositions: SankeyLayoutPositions;
  layoutPositions?: SankeyLayoutPositions;
  maxNodeValue: number;
  totalIncome: number;
}): SankeySeriesOption {
  const baseNodeMeta = new Map(baseData.nodes.map((node) => [node.name, node]));
  const detailNodeMeta = new Map(detailData.nodes.map((node) => [node.name, node]));
  const detailNodeValues = getSankeyNodeValues(detailData);
  const subcategoryLinks = detailData.links.filter((link) =>
    isExpenseSubcategoryNode(detailNodeMeta.get(link.target)),
  );
  const categoryNames = [...new Set(subcategoryLinks.map((link) => link.source))];
  const calibrationSource = "__overlay_calibration_source";
  const calibrationTarget = "__overlay_calibration_target";
  const hiddenNodeStyle = {
    color: "rgba(0, 0, 0, 0)",
    opacity: 0,
  };

  return {
    type: "sankey",
    top: 78,
    right: 190,
    bottom: 30,
    left: 150,
    nodeWidth: 16,
    nodeGap: 6,
    nodeAlign: "justify",
    layoutIterations: 0,
    z: 2,
    draggable: false,
    emphasis: {
      disabled: true,
    },
    labelLayout: {
      moveOverlap: "shiftY",
      hideOverlap: false,
    },
    label: {
      show: false,
    },
    lineStyle: {
      color: "gradient",
      opacity: 0.42,
      curveness: 0.46,
    },
    itemStyle: {
      borderWidth: 0,
    },
    data: [
      {
        name: calibrationSource,
        localX: 0.28,
        localY: 0.04,
        label: { show: false },
        itemStyle: hiddenNodeStyle,
      },
      {
        name: calibrationTarget,
        localX: 0.54,
        localY: 0.04,
        label: { show: false },
        itemStyle: hiddenNodeStyle,
      },
      ...categoryNames.map((category) => {
        const position = layoutPositions?.[category] ?? baseDefaultPositions[category] ?? {};
        const node = baseNodeMeta.get(category) ?? detailNodeMeta.get(category);

        return {
          name: category,
          depth: node?.depth,
          localX: position.localX,
          localY: position.localY,
          label: { show: false },
          itemStyle: hiddenNodeStyle,
        };
      }),
      ...subcategoryLinks.map((link) => {
        const node = detailNodeMeta.get(link.target);
        const position = layoutPositions?.[link.target] ?? detailDefaultPositions[link.target] ?? {};
        const value = detailNodeValues[link.target] ?? link.value;

        return {
          ...node,
          name: link.target,
          depth: node?.depth,
          localX: position.localX,
          localY: position.localY,
          label: buildNodeLabel({
            depth: node?.depth,
            detailed: true,
            displayName: node?.displayName,
            maxNodeValue,
            nodeName: link.target,
            totalIncome,
            value,
          }),
          itemStyle: {
            color: CATEGORY_COLORS[node?.category ?? link.source] ?? "#64748b",
          },
        };
      }),
    ],
    links: [
      {
        source: calibrationSource,
        target: calibrationTarget,
        value: Math.max(totalIncome, 1),
        lineStyle: {
          opacity: 0,
        },
      },
      ...subcategoryLinks.map((link) => {
        const sourceNode = detailNodeMeta.get(link.source);

        return {
          ...link,
          lineStyle: {
            color: CATEGORY_COLORS[sourceNode?.category ?? link.source] ?? "#94a3b8",
            opacity: 0.42,
          },
        };
      }),
    ],
  };
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
  const isCompactSubcategory = detailed && isSubcategory && depth !== 0;
  const share = value / Math.max(maxNodeValue, 1);
  const isIncomeSource = depth === 0 && !isTotalNode;
  const labelScale = getNodeLabelScale(depth, isTotalNode, nodeName);
  const fontSize = getNodeFontSize(share, isCompactSubcategory, isTotalNode) * labelScale;
  const overflow = isCompactSubcategory ? "truncate" : "break";
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
    lineHeight: isTotalNode
      ? fontSize + (isCompactTotalLabel(nodeName) ? 4 : 5)
      : fontSize + 3,
    width: getNodeLabelWidth(isCompactSubcategory, isTotalNode, share, isIncomeSource),
    position: getNodeLabelPosition(depth, isTotalNode),
    align: isTotalNode ? ("center" as const) : undefined,
    overflow: overflow as "truncate" | "break",
    backgroundColor: isTotalNode
      ? getTotalLabelBackground(nodeName)
      : undefined,
    borderColor: isTotalNode ? getTotalLabelBorder(nodeName) : undefined,
    borderWidth: isTotalNode ? 1 : 0,
    borderRadius: isTotalNode ? 6 : 0,
    padding: isTotalNode ? getTotalLabelPadding(nodeName) : 0,
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

  if (detailed && displayName && depth !== 0) {
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

function isIncomeSourceNode(nodeName: string, data: SankeyData) {
  return data.links.some((link) => link.source === nodeName && link.target === "총수입");
}

function isExpenseSubcategoryNode(node?: SankeyData["nodes"][number]) {
  return Boolean(node?.displayName && node.depth !== undefined && node.depth > 0);
}

function getNodeLabelScale(
  depth: number | undefined,
  isTotalNode: boolean,
  nodeName: string,
) {
  if (depth === 0 && !isTotalNode) return 0.9;
  if (isCompactTotalLabel(nodeName)) return 0.9;
  return 1;
}

function isCompactTotalLabel(nodeName: string) {
  return nodeName === "순이익" || nodeName === "총지출";
}

function getNodeFontSize(share: number, compact: boolean, isTotalNode: boolean) {
  if (isTotalNode) return 16;
  if (share >= 0.25) return compact ? 14 : 15;
  if (share >= 0.08) return compact ? 12 : 13;
  if (share >= 0.025) return compact ? 10 : 11;
  if (share >= 0.008) return compact ? 8 : 9;
  return compact ? 7 : 8;
}

function getNodeLabelColor(share: number, isTotalNode: boolean) {
  if (isTotalNode) return "#172033";
  if (share >= 0.08) return "#243044";
  if (share >= 0.025) return "#64748b";
  return "#94a3b8";
}

function getNodeLabelWidth(
  compact: boolean,
  isTotalNode: boolean,
  share: number,
  isIncomeSource: boolean,
) {
  if (isTotalNode) return undefined;
  const width = compact ? (share >= 0.08 ? 130 : 118) : (share >= 0.08 ? 132 : 118);

  return isIncomeSource ? width * 0.9 : width;
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
  const nodeValues = getSankeyNodeValues(data);
  const x = detailed
    ? getHorizontalLayout(true)
    : getHorizontalLayout(false);
  const incomeSourceLinks = data.links.filter((link) => link.target === "총수입");
  const expenseCategoryLinks = data.links.filter((link) => link.source === "총지출");
  const expenseCategories = expenseCategoryLinks
    .map((link) => link.target)
    .filter((name) => nodeMeta.has(name));
  const incomeSourceYs = stackIncomeSourcePositions(
    incomeSourceLinks.map((link) => ({
      name: link.source,
      value: link.value,
    })),
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
  const profitValue = nodeValues["순이익"] ?? 0;
  const expenseValue = nodeValues["총지출"] ?? 0;
  const profitIsUpper = profitValue >= expenseValue;

  setPosition(positions, nodeMeta, "총수입", x.totalIncome, 0.04);
  setPosition(positions, nodeMeta, "순이익", x.split, profitIsUpper ? 0.04 : 0.58);
  setPosition(positions, nodeMeta, "총지출", x.split, profitIsUpper ? 0.58 : 0.04);
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
    expenseSubcategory: detailed ? 0.94 : 0.92,
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

function stackIncomeSourcePositions(items: Array<{ name: string; value: number }>) {
  const positions: Record<string, number> = {};
  const totalValue = items.reduce((sum, item) => sum + Math.max(item.value, 0), 0);

  if (items.length === 0 || totalValue <= 0) return positions;

  const majorItems = items.filter((item) => item.value / totalValue >= 0.08);
  const minorItems = items.filter((item) => item.value / totalValue < 0.08);
  const majorPositions = stackPositionsByValue(majorItems, {
    end: minorItems.length > 0 ? 0.7 : 0.94,
    gap: 0.06,
    start: 0,
  });

  Object.assign(positions, majorPositions);

  if (minorItems.length > 0) {
    const minorYs = spreadPositions(minorItems.length, 0.78, 0.98);

    minorItems.forEach((item, index) => {
      positions[item.name] = minorYs[index];
    });
  }

  return positions;
}

function spreadPositions(count: number, start: number, end: number) {
  if (count <= 0) return [];
  if (count === 1) return [(start + end) / 2];

  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, index) => start + step * index);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function orderSankeyLinks(
  links: SankeyData["links"],
  nodeValues: Record<string, number>,
) {
  return [...links].sort((a, b) => {
    if (a.source !== b.source) return 0;

    if (a.source === "총수입") {
      const valueA = nodeValues[a.target] ?? a.value;
      const valueB = nodeValues[b.target] ?? b.value;

      return valueB - valueA;
    }

    if (a.source === "총지출") {
      return b.value - a.value;
    }

    return 0;
  });
}

function getTotalLabelBackground(nodeName: string) {
  if (nodeName === "초과지출") return "rgba(148, 163, 184, 0.24)";
  if (nodeName === "총수입") return "rgba(226, 232, 240, 0.78)";
  return "rgba(100, 116, 139, 0.16)";
}

function getTotalLabelBorder(nodeName: string) {
  if (nodeName === "초과지출") return "rgba(100, 116, 139, 0.28)";
  if (nodeName === "총수입") return "rgba(71, 85, 105, 0.32)";
  return "rgba(71, 85, 105, 0.18)";
}

function getTotalLabelPadding(nodeName: string): [number, number] {
  return isCompactTotalLabel(nodeName) ? [5, 7] : [6, 8];
}
