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
          return `<strong>${item.data.source} → ${item.data.target}</strong><br/>${formatKRW(item.data.value ?? 0)}`;
        }

        const value = nodeValues[item.name ?? ""] ?? 0;
        return `<strong>${item.name ?? ""}</strong><br/>${formatKRW(value)}`;
      },
    },
    series: [
      {
        type: "sankey",
        top: 24,
        right: detailed ? 160 : 120,
        bottom: 24,
        left: detailed ? 150 : 120,
        nodeWidth: detailed ? 14 : 18,
        nodeGap: detailed ? 12 : 20,
        nodeAlign: "justify",
        layoutIterations: 64,
        draggable: true,
        emphasis: {
          focus: "adjacency",
        },
        label: {
          color: "#172033",
          fontWeight: 700,
          fontSize: detailed ? 11 : 13,
          lineHeight: detailed ? 14 : 17,
          width: detailed ? 112 : 132,
          overflow: "break",
          formatter: (params: { name: string }) => {
            const meta = nodeMeta.get(params.name);
            const value = nodeValues[params.name] ?? 0;

            if (detailed && meta?.displayName) {
              return `${meta.displayName} ${formatCompactKRW(value)}`;
            }

            return `${formatLabel(meta?.displayName ?? params.name)}\n${formatCompactKRW(value)}`;
          },
        },
        lineStyle: {
          color: "gradient",
          opacity: detailed ? 0.3 : 0.38,
          curveness: 0.54,
        },
        itemStyle: {
          borderColor: "rgba(23, 32, 51, 0.28)",
          borderWidth: 0.5,
        },
        data: data.nodes.map((node) => ({
          ...node,
          depth: node.depth,
          label:
            detailed && node.displayName
              ? {
                  color: "#94a3b8",
                  fontWeight: 500,
                  fontSize: 10,
                  lineHeight: 12,
                  width: 168,
                  overflow: "truncate",
                }
              : undefined,
          itemStyle: {
            color: CATEGORY_COLORS[node.category ?? node.name] ?? "#64748b",
          },
        })),
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
  }), [data, detailed, nodeMeta, nodeValues]);

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
