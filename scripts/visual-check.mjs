import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.APP_URL ?? "http://127.0.0.1:5173/";
const outDir = "artifacts";
const failures = [];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});

page.on("console", (message) => {
  if (message.type() === "error") {
    failures.push(`console: ${message.text()}`);
  }
});
page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.locator("h1").filter({ hasText: "자산관리 목록" }).waitFor();

const boardListText = await page.locator("body").innerText();
if (!boardListText.includes("홍길동의 자산관리")) {
  failures.push("asset board list did not render the default public board");
}

await page.getByRole("button", { name: "홍길동의 자산관리 수정" }).waitFor();
await page.getByRole("button", { name: "홍길동의 자산관리 삭제" }).waitFor();
await page.screenshot({ path: `${outDir}/boards.png`, fullPage: true });

await page.getByRole("button", { name: "홍길동의 자산관리 열기" }).click();
await page.locator("h1").filter({ hasText: "자금흐름" }).waitFor();
await page.waitForSelector("canvas", { timeout: 10000 });

const heading = await page.locator("h1").first().textContent();
const canvasBox = await page.locator("canvas").first().boundingBox();
const summaryCardCount = await page.locator("section article").count();

if (!heading?.includes("자금흐름")) {
  failures.push("dashboard heading is missing the period label");
}

if (!canvasBox || canvasBox.width < 600 || canvasBox.height < 300) {
  failures.push("sankey canvas is missing or too small");
}

if (summaryCardCount < 5) {
  failures.push("dashboard summary cards did not render");
}

await page.screenshot({ path: `${outDir}/dashboard.png`, fullPage: true });

await page.getByRole("button", { name: "다음 연도" }).click();
await page.locator("h1").filter({ hasText: "2027년" }).waitFor();

const nextYearHeading = await page.locator("h1").first().textContent();
if (!nextYearHeading?.includes("2027년")) {
  failures.push("year stepper did not advance dashboard period to 2027");
}

await page.getByRole("button", { name: "이전 연도" }).click();
await page.locator("h1").filter({ hasText: "2026년" }).waitFor();
await page.waitForSelector("canvas", { timeout: 10000 });

await page.getByRole("button", { name: "소분류 표시" }).click();
await page.getByText("소분류 → 대분류").waitFor();

const detailCanvasBox = await page.locator("canvas").first().boundingBox();

if (!detailCanvasBox || detailCanvasBox.width < 600 || detailCanvasBox.height < 500) {
  failures.push("detailed sankey canvas is missing or too small");
}

await page.screenshot({ path: `${outDir}/dashboard-detail.png`, fullPage: true });

await page.getByRole("button", { name: "입력" }).click();
await page.getByRole("heading", { name: "분기·연도별 카테고리 입력" }).waitFor();
await page.locator("label").filter({ hasText: /^대분류/ }).locator("select").selectOption("온라인쇼핑");

const inputText = await page.locator("body").innerText();
if (!inputText.includes("결제/충전") || !inputText.includes("서비스구독") || !inputText.includes("인터넷쇼핑")) {
  failures.push("input page did not show expected online shopping subcategories");
}

const savedRows = await page.locator("tbody tr").count();
if (savedRows < 1) {
  failures.push("input page did not render saved flow entries");
}

await page.screenshot({ path: `${outDir}/input.png`, fullPage: true });

await browser.close();

if (failures.length > 0) {
  throw new Error(failures.join("\n"));
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checked: ["boards", "dashboard", "dashboard-detail", "input"],
      screenshots: [
        `${outDir}/boards.png`,
        `${outDir}/dashboard.png`,
        `${outDir}/dashboard-detail.png`,
        `${outDir}/input.png`,
      ],
    },
    null,
    2,
  ),
);
