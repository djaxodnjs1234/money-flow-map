import { useEffect, useMemo, useRef } from "react";
import { SankeyChart as EChartsSankeyChart, type SankeySeriesOption } from "echarts/charts";
import {
  TooltipComponent,
  type TooltipComponentOption,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import type { SankeyData } from "../utils/sankeyTransform";
import { getSankeyNodeValues } from "../utils/sankeyTransform";
import { formatCompactKRW, formatKRW } from "../utils/format";
import { CATEGORY_COLORS } from "../constants/categories";

echarts.use([EChartsSankeyChart, TooltipComponent, CanvasRenderer]);

type SankeyOption = ComposeOption<SankeySeriesOption | TooltipComponentOption>;
type TooltipParam = {
  dataType?: string;
  data?: { source?: string; target?: string; value?: number } | null;
  name?: string;
};

interface SankeyChartProps {
  data: SankeyData;
  height?: number;
  detailed?: boolean;
}

export default function SankeyChart({ data, height = 560, detailed = false }: SankeyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const nodeValues = useMemo(() => getSankeyNodeValues(data), [data]);
  const hasData = data.links.length > 0;
  const nodeMeta = useMemo(
    () => new Map(data.nodes.map((node) => [node.name, node])),
    [data.nodes],
  );
  const maxNodeValue = useMemo(
    () => Math.max(...Object.values(nodeValues), 1),
    [nodeValues],
  );

  const option = useMemo<SankeyOption>(() => ({
    backgroundColor: "transparent",
    animation: false,
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
        top: detailed ? 34 : 30,
        right: detailed ? 240 : 170,
        bottom: detailed ? 34 : 30,
        left: detailed ? 220 : 170,
        nodeWidth: detailed ? 12 : 16,
        nodeGap: detailed ? 14 : 24,
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
          opacity: detailed ? 0.34 : 0.42,
          curveness: 0.5,
        },
        itemStyle: {
          borderColor: "rgba(23, 32, 51, 0.28)",
          borderWidth: 0.5,
        },
        data: data.nodes.map((node) => {
          const value = nodeValues[node.name] ?? 0;
          const label = buildNodeLabel({
            detailed,
            maxNodeValue,
            nodeName: node.name,
            displayName: node.displayName,
            depth: node.depth,
            totalIncome: nodeValues["총수입"] ?? 0,
            value,
          });

          return {
            ...node,
            depth: node.depth,
            label,
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
  }), [data, detailed, maxNodeValue, nodeMeta, nodeValues]);

  useEffect(() => {
    const element = chartRef.current;
    if (!element) return;

    if (!hasData) {
      echarts.getInstanceByDom(element)?.dispose();
      return;
    }

    const chart = echarts.getInstanceByDom(element) ?? echarts.init(element);
    chart.setOption(option, { notMerge: true, lazyUpdate: true });

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
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
    detailed,
    displayName,
    isTotalNode,
    nodeName,
    totalIncome,
    value,
  });

  return {
    color: getNodeLabelColor(share, isTotalNode),
    fontWeight: isTotalNode || share >= 0.08 ? 700 : 500,
    fontSize,
    lineHeight: isTotalNode ? fontSize + 5 : fontSize + 3,
    width: getNodeLabelWidth(detailed, isTotalNode, share),
    position: getNodeLabelPosition(detailed, depth, isTotalNode, isSubcategory),
    overflow: overflow as "truncate" | "break",
    backgroundColor: isTotalNode
      ? getTotalLabelBackground(nodeName)
      : isDetailedCategory
        ? "rgba(255, 255, 255, 0.72)"
        : undefined,
    borderColor: isTotalNode ? getTotalLabelBorder(nodeName) : undefined,
    borderWidth: isTotalNode ? 1 : 0,
    borderRadius: isTotalNode ? 6 : isDetailedCategory ? 4 : 0,
    padding: isTotalNode ? [8, 10] : isDetailedCategory ? [2, 4] : 0,
    formatter: () => labelText,
  };
}

function getNodeLabelText({
  detailed,
  displayName,
  isTotalNode,
  nodeName,
  totalIncome,
  value,
}: {
  detailed: boolean;
  displayName?: string;
  isTotalNode: boolean;
  nodeName: string;
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
  return detailed ? 8 : 9;
}

function getNodeLabelColor(share: number, isTotalNode: boolean) {
  if (isTotalNode) return "#172033";
  if (share >= 0.08) return "#243044";
  if (share >= 0.025) return "#64748b";
  return "#94a3b8";
}

function getNodeLabelWidth(detailed: boolean, isTotalNode: boolean, share: number) {
  if (isTotalNode) return detailed ? 132 : 122;
  if (detailed) return share >= 0.08 ? 160 : 184;
  return share >= 0.08 ? 132 : 118;
}

function getNodeLabelPosition(
  detailed: boolean,
  depth: number | undefined,
  isTotalNode: boolean,
  isSubcategory: boolean,
): "right" | undefined {
  if (!detailed || isTotalNode || isSubcategory) return undefined;
  return depth !== undefined && depth >= 3 ? "right" : undefined;
}

function getTotalLabelBackground(nodeName: string) {
  if (nodeName === "초과지출") return "rgba(148, 163, 184, 0.24)";
  return "rgba(100, 116, 139, 0.16)";
}

function getTotalLabelBorder(nodeName: string) {
  if (nodeName === "초과지출") return "rgba(100, 116, 139, 0.28)";
  return "rgba(71, 85, 105, 0.18)";
}
