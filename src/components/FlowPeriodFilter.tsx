import { useEffect, useMemo, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import type { FlowPeriodSelection, FlowPeriodType } from "../types/flow";

interface FlowPeriodFilterProps {
  value: FlowPeriodSelection;
  years: number[];
  onChange: (value: FlowPeriodSelection) => void;
}

const PERIODS: Array<{ value: FlowPeriodType; label: string }> = [
  { value: "quarter", label: "분기별" },
  { value: "year", label: "연도별" },
];

const MIN_YEAR = 1900;
const MAX_YEAR = 2200;
const QUICK_YEARS = [2023, 2024, 2025, 2026];
const YEAR_SUGGESTIONS_ID = "flow-year-suggestions";

const clampYear = (year: number) => Math.min(MAX_YEAR, Math.max(MIN_YEAR, year));

export default function FlowPeriodFilter({ value, years, onChange }: FlowPeriodFilterProps) {
  const [yearDraft, setYearDraft] = useState(String(value.year));

  const suggestedYears = useMemo(
    () =>
      Array.from(new Set([...years, value.year - 1, value.year, value.year + 1]))
        .filter((year) => year >= MIN_YEAR && year <= MAX_YEAR)
        .sort((a, b) => b - a),
    [value.year, years],
  );

  useEffect(() => {
    setYearDraft(String(value.year));
  }, [value.year]);

  const commitYear = (rawYear = yearDraft) => {
    const parsedYear = Number(rawYear);

    if (!Number.isInteger(parsedYear)) {
      setYearDraft(String(value.year));
      return;
    }

    const nextYear = clampYear(parsedYear);
    setYearDraft(String(nextYear));

    if (nextYear !== value.year) {
      onChange({ ...value, year: nextYear });
    }
  };

  const shiftYear = (amount: number) => {
    const nextYear = clampYear(value.year + amount);
    setYearDraft(String(nextYear));
    onChange({ ...value, year: nextYear });
  };

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-soft lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <CalendarRange className="h-5 w-5 text-river" aria-hidden="true" />
        조회 기간
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

        <div className="inline-flex h-10 overflow-hidden rounded-md border border-slate-200 bg-white">
          <button
            type="button"
            aria-label="이전 연도"
            className="flex w-10 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={value.year <= MIN_YEAR}
            onClick={() => shiftYear(-1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <input
            aria-label="연도 입력"
            type="number"
            inputMode="numeric"
            min={MIN_YEAR}
            max={MAX_YEAR}
            list={YEAR_SUGGESTIONS_ID}
            className="w-24 border-x border-slate-200 px-3 text-center text-sm font-semibold text-ink outline-none transition focus:border-river focus:ring-2 focus:ring-river/20"
            value={yearDraft}
            onChange={(event) => setYearDraft(event.target.value)}
            onBlur={() => commitYear()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitYear(event.currentTarget.value);
                event.currentTarget.blur();
              }
            }}
          />

          <button
            type="button"
            aria-label="다음 연도"
            className="flex w-10 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={value.year >= MAX_YEAR}
            onClick={() => shiftYear(1)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>

          <datalist id={YEAR_SUGGESTIONS_ID}>
            {suggestedYears.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </datalist>
        </div>

        <div className="flex flex-wrap gap-1">
          {QUICK_YEARS.map((year) => (
            <button
              key={year}
              type="button"
              className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${
                value.year === year
                  ? "border-river bg-river text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-river/40 hover:bg-river/5"
              }`}
              onClick={() => commitYear(String(year))}
            >
              {String(year).slice(2)}년
            </button>
          ))}
        </div>

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
