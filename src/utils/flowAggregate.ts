import { INCOME_PARENT_CATEGORY } from "../constants/categories";
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
  if (type === "income") {
    return aggregateIncomeSources(entries);
  }

  return aggregateExpenseCategories(entries);
}

function aggregateExpenseCategories(entries: FlowEntry[]): Record<string, number> {
  return entries
    .filter((entry) => entry.type === "expense")
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
  const incomeTotals = aggregateIncomeSources(entries);
  const expenseTotals = aggregateExpenseCategories(entries);
  const expenseSubcategoryTotals = aggregateExpenseSubcategories(entries);
  const orderedIncomeSources = sortTotalsDescending(incomeTotals);
  const orderedExpenseCategories = sortTotalsDescending(expenseTotals);
  const nodes = new Map<string, SankeyNode>();
  const links: SankeyLink[] = [];
  const totalIncomeDepth = orderedIncomeSources.length > 0 ? 1 : 0;
  const totalExpenseDepth = totalIncomeDepth + 1;
  const profitDepth = totalExpenseDepth;
  const expenseCategoryDepth = totalExpenseDepth + 1;
  const expenseSubcategoryDepth = showSubcategories ? expenseCategoryDepth + 1 : expenseCategoryDepth;

  const addNode = (node: SankeyNode) => {
    if (!nodes.has(node.name)) {
      nodes.set(node.name, node);
    }
  };

  if (metrics.totalIncome > 0) {
    addNode({ name: "총수입", depth: totalIncomeDepth, category: "총수입" });

    orderedIncomeSources.forEach(([source, value]) => {
      const nodeName = getSubcategoryNodeName(INCOME_PARENT_CATEGORY, source);
      addNode({
        name: nodeName,
        displayName: source,
        depth: 0,
        category: source,
      });
      links.push({ source: nodeName, target: "총수입", value });
    });
  }

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
    addNode({ name: "순이익", depth: profitDepth, category: "순이익" });
    links.push({ source: "총수입", target: "순이익", value: metrics.netAmount });
  }

  if (metrics.netAmount < 0) {
    addNode({ name: "초과지출", depth: totalIncomeDepth, category: "초과지출" });
    addNode({ name: "총지출", depth: totalExpenseDepth, category: "총지출" });
    links.push({ source: "초과지출", target: "총지출", value: Math.abs(metrics.netAmount) });
  }

  orderedExpenseCategories.forEach(([category, value]) => {
    addNode({ name: "총지출", depth: totalExpenseDepth, category: "총지출" });
    addNode({ name: category, depth: expenseCategoryDepth, category });
    links.push({ source: "총지출", target: category, value });
  });

  if (showSubcategories) {
    orderedExpenseCategories.forEach(([category]) => {
      sortTotalsDescending(expenseSubcategoryTotals[category] ?? {}).forEach(([subcategory, value]) => {
        const nodeName = getSubcategoryNodeName(category, subcategory);
        addNode({
          name: nodeName,
          displayName: subcategory,
          depth: expenseSubcategoryDepth,
          category,
        });
        links.push({ source: category, target: nodeName, value });
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

function aggregateIncomeSources(entries: FlowEntry[]): Record<string, number> {
  return entries
    .filter((entry) => entry.type === "income")
    .reduce<Record<string, number>>((acc, entry) => {
      if (entry.category === INCOME_PARENT_CATEGORY) {
        entry.subcategories
          .filter((subcategory) => subcategory.amount > 0)
          .forEach((subcategory) => {
            acc[subcategory.name] = (acc[subcategory.name] ?? 0) + subcategory.amount;
          });
        return acc;
      }

      acc[entry.category] = (acc[entry.category] ?? 0) + entry.totalAmount;
      return acc;
    }, {});
}

function aggregateExpenseSubcategories(entries: FlowEntry[]) {
  return entries
    .filter((entry) => entry.type === "expense")
    .reduce<Record<string, Record<string, number>>>((acc, entry) => {
      const categoryTotals = acc[entry.category] ?? {};

      entry.subcategories
        .filter((subcategory) => subcategory.amount > 0)
        .forEach((subcategory) => {
          categoryTotals[subcategory.name] =
            (categoryTotals[subcategory.name] ?? 0) + subcategory.amount;
        });

      acc[entry.category] = categoryTotals;
      return acc;
    }, {});
}

function sortTotalsDescending(totals: Record<string, number>) {
  return Object.entries(totals)
    .filter(([, value]) => value > 0)
    .sort(([nameA, valueA], [nameB, valueB]) => {
      if (valueB !== valueA) return valueB - valueA;
      return nameA.localeCompare(nameB, "ko-KR");
    });
}

function getSubcategoryNodeName(category: string, subcategory: string) {
  return `${category} / ${subcategory}`;
}
