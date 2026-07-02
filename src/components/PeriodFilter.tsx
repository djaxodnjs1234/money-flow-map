import { CalendarDays } from "lucide-react";
import type { PeriodSelection, PeriodType } from "../types/transaction";

interface PeriodFilterProps {
  value: PeriodSelection;
  years: number[];
  onChange: (value: PeriodSelection) => void;
}

const PERIODS: Array<{ value: PeriodType; label: string }> = [
  { value: "month", label: "월별" },
  { value: "quarter", label: "분기별" },
  { value: "year", label: "연도별" },
];

export default function PeriodFilter({ value, years, onChange }: PeriodFilterProps) {
  const selectableYears = years.length > 0 ? years : [value.year];

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-soft lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <CalendarDays className="h-5 w-5 text-river" aria-hidden="true" />
        기간 필터
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              type="button"
              className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
                value.periodType === period.value
                  ? "bg-ink text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
              onClick={() => onChange({ ...value, periodType: period.value })}
            >
              {period.label}
            </button>
          ))}
        </div>

        <select
          aria-label="연도 선택"
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
          value={value.year}
          onChange={(event) => onChange({ ...value, year: Number(event.target.value) })}
        >
          {selectableYears.map((year) => (
            <option key={year} value={year}>
              {year}년
            </option>
          ))}
        </select>

        {value.periodType === "month" && (
          <select
            aria-label="월 선택"
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
            value={value.month}
            onChange={(event) => onChange({ ...value, month: Number(event.target.value) })}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
              <option key={month} value={month}>
                {month}월
              </option>
            ))}
          </select>
        )}

        {value.periodType === "quarter" && (
          <select
            aria-label="분기 선택"
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
            value={value.quarter}
            onChange={(event) => onChange({ ...value, quarter: Number(event.target.value) })}
          >
            {[1, 2, 3, 4].map((quarter) => (
              <option key={quarter} value={quarter}>
                {quarter}분기
              </option>
            ))}
          </select>
        )}
      </div>
    </section>
  );
}
