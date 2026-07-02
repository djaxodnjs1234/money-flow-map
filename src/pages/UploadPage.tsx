import { Download, UploadCloud } from "lucide-react";
import UploadBox from "../components/UploadBox";
import { useTransactionsStore } from "../store/transactionsStore";
import { toCsvCell } from "../utils/format";
import type { Transaction } from "../types/transaction";

const TEMPLATE_HEADERS = ["date", "type", "amount", "category", "description", "memo", "source"];

export default function UploadPage() {
  const addTransactions = useTransactionsStore((state) => state.addTransactions);

  function downloadTemplate() {
    const sample = [
      TEMPLATE_HEADERS.join(","),
      ["2026-07-01", "income", "3000000", "급여", "7월 급여", "", "직접 정리"].map(toCsvCell).join(","),
      ["2026-07-02", "expense", "18500", "식비", "점심", "회사 근처", "직접 정리"].map(toCsvCell).join(","),
    ].join("\n");

    const blob = new Blob([`\uFEFF${sample}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "money-flow-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(transactions: Transaction[]) {
    addTransactions(transactions);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-river">Import</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-ink">
            거래내역 가져오기
          </h1>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft transition hover:bg-slate-50"
          onClick={downloadTemplate}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          CSV 템플릿
        </button>
      </div>

      <UploadBox onImport={handleImport} />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-river" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-ink">지원 컬럼</h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">내부 필드</th>
                <th className="px-3 py-2">예시 컬럼명</th>
                <th className="px-3 py-2">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="px-3 py-2 font-semibold text-ink">date</td>
                <td className="px-3 py-2">거래일, 날짜, 일자</td>
                <td className="px-3 py-2">YYYY-MM-DD 권장</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-ink">type</td>
                <td className="px-3 py-2">구분, 유형, 수입/지출</td>
                <td className="px-3 py-2">income/expense 또는 수입/지출</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-ink">amount</td>
                <td className="px-3 py-2">금액, 거래금액, 이용금액</td>
                <td className="px-3 py-2">양수로 저장</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-semibold text-ink">category</td>
                <td className="px-3 py-2">카테고리, 분류, 대분류</td>
                <td className="px-3 py-2">큰 카테고리 기준</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
