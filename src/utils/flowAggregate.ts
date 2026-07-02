import type { FlowEntry, FlowPeriodSelection } from "../types/flow";
import type { TransactionType } from "../types/transaction";
import type { SankeyData, SankeyLink, SankeyNode } from "./sankeyTransform";

export interface FlowSummaryMetrics {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  spendingRate: number;
  entryCount: number;
}

interface TransformOptions {
  showSubcategories: boolean;
}

export function filterFlowEntriesByPeriod(
  entries: FlowEntry[],
  selection: FlowPeriodSelection,
) {
  return entries.filter((entry) => {
    if (entry.periodType !== selection.periodType) return false;
    if (entry.year !== selection.year) return false;

    if (selection.periodType === "quarter") {
      return entry.quarter === selection.quarter;
    }

    return true;
  });
}

export function getFlowPeriodLabel(selection: FlowPeriodSelection) {
  if (selection.periodType === "quarter") {
    return `${selection.year}년 ${selection.quarter}분기 자금흐름`;
  }

  return `${selection.year}년 연간 자금흐름`;
}

export function getAvailableFlowYears(entries: FlowEntry[]) {
  const years = new Set(entries.map((entry) => entry.year));
  return [...years].sort((a, b) => b - a);
}

export function getFlowSummaryMetrics(entries: FlowEntry[]): FlowSummaryMetrics {
  const totalIncome = sumEntries(entries, "income");
  const totalExpense = sumEntries(entries, "expense");

  return {
    totalIncome,
    totalExpense,
    netAmount: totalIncome - totalExpense,
    spendingRate: totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0,
    entryCount: entries.length,
  };
}

export function aggregateFlowByCategory(
  entries: FlowEntry[],
  type: TransactionType,
): Record<string, number> {
  return entries
    .filter((entry) => entry.type === type)
    .reduce<Record<string, number>>((acc, entry) => {
      acc[entry.category] = (acc[entry.category] ?? 0) + entry.totalAmount;
      return acc;
    }, {});
}

export function transformFlowToSankeyData(
  entries: FlowEntry[],
  { showSubcategories }: TransformOptions,
): SankeyData {
  const metrics = getFlowSummaryMetrics(entries);
  const incomeTotals = aggregateFlowByCategory(entries, "income");
  const expenseTotals = aggregateFlowByCategory(entries, "expense");
  const nodes = new Map<string, SankeyNode>();
  const links: SankeyLink[] = [];
  const hasDetailedIncome =
    showSubcategories &&
    entries.some((entry) => entry.type === "income" && hasMeaningfulSubcategories(entry));
  const incomeCategoryDepth = hasDetailedIncome ? 1 : 0;
  const totalIncomeDepth = hasDetailedIncome ? 2 : 1;
  const totalExpenseDepth = hasDetailedIncome ? 3 : 2;
  const expenseCategoryDepth = showSubcategories ? (hasDetailedIncome ? 4 : 3) : 3;
  const terminalDepth = showSubcategories ? (hasDetailedIncome ? 5 : 4) : 3;

  const addNode = (node: SankeyNode) => {
    if (!nodes.has(node.name)) {
      nodes.set(node.name, node);
    }
  };

  entries
    .filter((entry) => entry.type === "income" && entry.totalAmount > 0)
    .forEach((entry) => {
      addNode({ name: entry.category, depth: incomeCategoryDepth, category: entry.category });
      addNode({ name: "총수입", depth: totalIncomeDepth, category: "총수입" });

      if (showSubcategories && hasMeaningfulSubcategories(entry)) {
        entry.subcategories
          .filter((subcategory) => subcategory.amount > 0)
          .forEach((subcategory) => {
            const nodeName = getSubcategoryNodeName(entry.category, subcategory.name);
            addNode({
              name: nodeName,
              displayName: subcategory.name,
              depth: 0,
              category: entry.category,
            });
            links.push({ source: nodeName, target: entry.category, value: subcategory.amount });
          });
      }
    });

  Object.entries(incomeTotals).forEach(([category, value]) => {
    if (value <= 0) return;
    const entry = entries.find((item) => item.type === "income" && item.category === category);
    addNode({
      name: category,
      depth: showSubcategories && hasMeaningfulSubcategories(entry) ? 1 : incomeCategoryDepth,
      category,
    });
    addNode({ name: "총수입", depth: totalIncomeDepth, category: "총수입" });
    links.push({ source: category, target: "총수입", value });
  });

  if (metrics.totalExpense > 0) {
    addNode({ name: "총수입", depth: totalIncomeDepth, category: "총수입" });
    addNode({ name: "총지출", depth: totalExpenseDepth, category: "총지출" });
    links.push({
      source: "총수입",
      target: "총지출",
      value: Math.min(metrics.totalIncome || metrics.totalExpense, metrics.totalExpense),
    });
  }

  if (metrics.netAmount > 0) {
    addNode({ name: "잔액", depth: terminalDepth, category: "잔액" });
    links.push({ source: "총수입", target: "잔액", value: metrics.netAmount });
  }

  if (metrics.netAmount < 0) {
    addNode({ name: "초과지출", depth: totalIncomeDepth, category: "초과지출" });
    addNode({ name: "총지출", depth: totalExpenseDepth, category: "총지출" });
    links.push({ source: "초과지출", target: "총지출", value: Math.abs(metrics.netAmount) });
  }

  Object.entries(expenseTotals).forEach(([category, value]) => {
    if (value <= 0) return;
    addNode({ name: "총지출", depth: totalExpenseDepth, category: "총지출" });
    addNode({ name: category, depth: expenseCategoryDepth, category });
    links.push({ source: "총지출", target: category, value });
  });

  if (showSubcategories) {
    entries
      .filter((entry) => entry.type === "expense" && entry.totalAmount > 0)
      .forEach((entry) => {
        entry.subcategories
          .filter((subcategory) => subcategory.amount > 0)
          .forEach((subcategory) => {
            const nodeName = getSubcategoryNodeName(entry.category, subcategory.name);
            addNode({
              name: nodeName,
              displayName: subcategory.name,
              depth: terminalDepth,
              category: entry.category,
            });
            links.push({ source: entry.category, target: nodeName, value: subcategory.amount });
          });
      });
  }

  return {
    nodes: [...nodes.values()],
    links: links.filter((link) => link.value > 0),
  };
}

function sumEntries(entries: FlowEntry[], type: TransactionType) {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((sum, entry) => sum + entry.totalAmount, 0);
}

function getSubcategoryNodeName(category: string, subcategory: string) {
  return `${category} / ${subcategory}`;
}

function hasMeaningfulSubcategories(entry?: FlowEntry) {
  if (!entry) return false;
  return entry.subcategories.some((subcategory) => subcategory.name !== "미분류");
}
