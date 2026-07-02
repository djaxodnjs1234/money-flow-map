import { CATEGORY_COLORS } from "../constants/categories";
import { formatKRW } from "../utils/format";
import { sortTotals } from "../utils/aggregate";

interface CategorySummaryProps {
  title: string;
  totals: Record<string, number>;
  emptyText: string;
}

export default function CategorySummary({ title, totals, emptyText }: CategorySummaryProps) {
  const rows = sortTotals(totals);
  const max = rows[0]?.[1] ?? 0;
  const total = rows.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{formatKRW(total)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {rows.length === 0 && <p className="text-sm text-slate-500">{emptyText}</p>}

        {rows.map(([category, amount]) => {
          const width = max > 0 ? Math.max(6, Math.round((amount / max) * 100)) : 0;
          const color = CATEGORY_COLORS[category] ?? "#64748b";

          return (
            <div key={category}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-ink">{category}</span>
                <span className="font-medium text-slate-600">{formatKRW(amount)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${width}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
