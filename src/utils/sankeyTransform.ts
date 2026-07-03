import { aggregateByCategory, getSummaryMetrics } from "./aggregate";
import type { Transaction } from "../types/transaction";

export interface SankeyNode {
  name: string;
  displayName?: string;
  depth?: number;
  category?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export function transformToSankeyData(transactions: Transaction[]): SankeyData {
  const incomeTotals = aggregateByCategory(transactions, "income");
  const expenseTotals = aggregateByCategory(transactions, "expense");
  const summary = getSummaryMetrics(transactions);

  const links: SankeyLink[] = [];
  const nodes = new Set<string>();

  Object.entries(incomeTotals).forEach(([category, value]) => {
    if (value <= 0) return;
    nodes.add(category);
    nodes.add("총수입");
    links.push({ source: category, target: "총수입", value });
  });

  if (summary.totalExpense > 0) {
    nodes.add("총수입");
    nodes.add("총지출");
    links.push({
      source: "총수입",
      target: "총지출",
      value: Math.min(summary.totalIncome || summary.totalExpense, summary.totalExpense),
    });
  }

  if (summary.netAmount > 0) {
    nodes.add("총수입");
    nodes.add("순이익");
    links.push({ source: "총수입", target: "순이익", value: summary.netAmount });
  }

  if (summary.netAmount < 0) {
    nodes.add("초과지출");
    nodes.add("총지출");
    links.push({ source: "초과지출", target: "총지출", value: Math.abs(summary.netAmount) });
  }

  Object.entries(expenseTotals).forEach(([category, value]) => {
    if (value <= 0) return;
    nodes.add("총지출");
    nodes.add(category);
    links.push({ source: "총지출", target: category, value });
  });

  return {
    nodes: [...nodes].map((name) => ({ name })),
    links: links.filter((link) => link.value > 0),
  };
}

export function getSankeyNodeValues(data: SankeyData) {
  return data.nodes.reduce<Record<string, number>>((acc, node) => {
    const outgoing = data.links
      .filter((link) => link.source === node.name)
      .reduce((sum, link) => sum + link.value, 0);
    const incoming = data.links
      .filter((link) => link.target === node.name)
      .reduce((sum, link) => sum + link.value, 0);

    acc[node.name] = Math.max(outgoing, incoming);
    return acc;
  }, {});
}
