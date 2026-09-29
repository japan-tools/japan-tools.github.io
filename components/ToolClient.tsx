"use client";

import { getTool } from "@/lib/tools/registry";
import CatalogToolScreen from "@/components/CatalogToolScreen";
import {
  DeveloperToolScreen,
  HtmlToMarkdownScreen,
  CronScreen,
  RegexScreen,
  UuidScreen,
  XmlScreen,
} from "@/components/DeveloperTools";
import {
  CsvToJsonScreen,
  JsonFormatterScreen,
  JsonMinifierScreen,
  JsonToCsvScreen,
  JsonViewerScreen,
  JwtDecoderScreen,
} from "@/components/JsonTools";
import LivingCostScreen from "@/components/LivingCostTools";
import {
  AgeScreen,
  BusinessDaysScreen,
  DateAddScreen,
  DateDifferenceScreen,
  DateUtilityScreen,
  HolidayScreen,
} from "@/components/DateTools";
import {
  DiscountScreen,
  ElectricityScreen,
  GasScreen,
  SplitBillScreen,
  TaxScreen,
} from "@/components/FinancialTools";
import {
  AnnualMonthlyScreen,
  EmploymentInsuranceScreen,
  HourlyWageScreen,
  OvertimeScreen,
  PaidLeaveScreen,
  PensionScreen,
  SalaryTakeHomeScreen,
  TakeHomePayScreen,
  WorkPremiumScreen,
} from "@/components/WorkTools";
import {
  LifeCostScreen,
  MortgageScreen,
  MovingCostScreen,
  RentInitialCostScreen,
  UtilityScreen,
} from "@/components/HousingTools";
import {
  ChildAllowanceScreen,
  ChildcareBenefitScreen,
  MaternityStartScreen,
} from "@/components/FamilyTools";
import {
  IncomeTaxScreen,
  ResidentTaxScreen,
  SocialInsuranceScreen,
} from "@/components/TaxTools";

function getToolUsage(name: string) {
  if (name.includes("Formatter") || name.includes("Minifier"))
    return "入力欄にデータを貼り付けて、整形・圧縮ボタンを押してください。";
  if (name.includes("Regex"))
    return "正規表現とテスト対象の文字列を入力してください。";
  if (name.includes("Diff")) return "比較する2つのテキストを入力してください。";
  if (name.includes("Encoder") || name.includes("Decoder"))
    return "変換する文字列を入力して実行してください。";
  if (
    name.includes("日付") ||
    name.includes("年齢") ||
    name.includes("勤続") ||
    name.includes("期間")
  )
    return "対象日を選択すると結果を計算します。";
  if (
    name.includes("税") ||
    name.includes("保険") ||
    name.includes("年金") ||
    name.includes("給付")
  )
    return "必要な金額と条件を入力して目安を確認してください。";
  if (name.includes("ローン") || name.includes("返済") || name.includes("積立"))
    return "金額、利率、期間を入力して計算してください。";
  return "各入力欄に条件を入力すると、結果が表示されます。";
}

export default function ToolClient({ slug }: { slug: string }) {
  const map: Record<string, React.ReactNode> = {
    "take-home-pay": <TakeHomePayScreen />,
    "salary-take-home": <SalaryTakeHomeScreen />,
    "income-tax": <IncomeTaxScreen />,
    "resident-tax": <ResidentTaxScreen />,
    "social-insurance": <SocialInsuranceScreen />,
    "overtime-pay": <OvertimeScreen />,
    "hourly-wage": <HourlyWageScreen />,
    "pension-premium": <PensionScreen />,
    "employment-insurance": <EmploymentInsuranceScreen />,
    "annual-monthly": <AnnualMonthlyScreen />,
    "paid-leave": <PaidLeaveScreen />,
    "overtime-hours": <WorkPremiumScreen type="hours" />,
    "night-overtime": <WorkPremiumScreen type="night" />,
    "holiday-work": <WorkPremiumScreen type="holiday" />,
    "resignation-date": <DateUtilityScreen type="resignation" />,
    "service-years": <DateUtilityScreen type="service" />,
    "age-calculator": <AgeScreen />,
    "date-difference": <DateDifferenceScreen />,
    "date-add-subtract": <DateAddScreen />,
    "business-days": <BusinessDaysScreen />,
    "japanese-era": <DateUtilityScreen type="era" />,
    zodiac: <DateUtilityScreen type="zodiac" />,
    "month-edges": <DateUtilityScreen type="month-edge" />,
    "japanese-holiday": <HolidayScreen />,
    "due-date": <DateUtilityScreen type="due" />,
    "pregnancy-weeks": <DateUtilityScreen type="pregnancy" />,
    "baby-age": <DateUtilityScreen type="baby" />,
    "nursery-age": <DateUtilityScreen type="nursery" />,
    "parental-leave": <DateUtilityScreen type="leave" />,
    "maternity-leave": <DateUtilityScreen type="maternity" />,
    "maternity-start-date": <MaternityStartScreen />,
    "childcare-benefit": <ChildcareBenefitScreen />,
    "child-allowance": <ChildAllowanceScreen />,
    mortgage: <MortgageScreen />,
    "rent-initial-cost": <RentInitialCostScreen />,
    "moving-cost": <MovingCostScreen />,
    "gas-bill": <UtilityScreen kind="gas" />,
    "water-bill": <UtilityScreen kind="water" />,
    "deposit-key-money": <LifeCostScreen type="deposit" />,
    "rent-income-ratio": <LifeCostScreen type="ratio" />,
    "commuter-pass": <LifeCostScreen type="commuter" />,
    "car-ownership": <LifeCostScreen type="car" />,
    "nhk-fee": <LifeCostScreen type="nhk" />,
    "tax-calculator": <TaxScreen />,
    "discount-calculator": <DiscountScreen />,
    "split-bill": <SplitBillScreen />,
    "gas-cost": <GasScreen />,
    "electricity-cost": <ElectricityScreen />,
    "catalog-128": <MaternityStartScreen />,
    "catalog-166": <LivingCostScreen name="電気代計算" />,
    "catalog-167": <LivingCostScreen name="エアコン電気代計算" />,
    "catalog-168": <LivingCostScreen name="PC電気代計算" />,
    "catalog-169": <LivingCostScreen name="ゲーミングPC電気代計算" />,
    "catalog-170": <LivingCostScreen name="冷蔵庫電気代計算" />,
    "catalog-171": <LivingCostScreen name="テレビ電気代計算" />,
    "catalog-172": <LivingCostScreen name="洗濯機電気代計算" />,
    "catalog-173": <LivingCostScreen name="ドライヤー電気代計算" />,
    "catalog-174": <LivingCostScreen name="電子レンジ電気代計算" />,
    "catalog-175": <LivingCostScreen name="電気代年間計算" />,
    "catalog-176": <LivingCostScreen name="ガス代概算" />,
    "catalog-177": <LivingCostScreen name="水道代概算" />,
    "catalog-178": <LivingCostScreen name="一人暮らし生活費計算" />,
    "catalog-179": <LivingCostScreen name="二人暮らし生活費計算" />,
    "catalog-180": <LivingCostScreen name="家族生活費計算" />,
    "catalog-181": <LivingCostScreen name="通信費年間計算" />,
    "catalog-182": <LivingCostScreen name="サブスク年間費用計算" />,
    "catalog-183": <LivingCostScreen name="固定費削減額計算" />,
    "catalog-184": <LivingCostScreen name="電気料金プラン比較" />,
    "catalog-185": <LivingCostScreen name="消費電力量計算" />,
    "catalog-186": <JsonFormatterScreen />,
    "catalog-187": <JsonMinifierScreen />,
    "catalog-188": <JsonViewerScreen />,
    "catalog-189": <JsonToCsvScreen />,
    "catalog-190": <CsvToJsonScreen />,
    "catalog-191": <JwtDecoderScreen />,
    "catalog-192": <DeveloperToolScreen kind="base64-encoder" />,
    "catalog-193": <DeveloperToolScreen kind="base64-decoder" />,
    "catalog-194": <DeveloperToolScreen kind="url-encoder" />,
    "catalog-195": <DeveloperToolScreen kind="url-decoder" />,
    "catalog-196": <UuidScreen />,
    "catalog-197": <DeveloperToolScreen kind="timestamp-converter" />,
    "catalog-198": <DeveloperToolScreen kind="timestamp-generator" />,
    "catalog-199": <CronScreen />,
    "catalog-200": <RegexScreen />,
    "catalog-201": <DeveloperToolScreen kind="text-diff" />,
    "catalog-202": <DeveloperToolScreen kind="sql-formatter" />,
    "catalog-203": <DeveloperToolScreen kind="yaml-formatter" />,
    "catalog-204": <XmlScreen />,
    "catalog-205": <DeveloperToolScreen kind="html-formatter" />,
    "catalog-206": <DeveloperToolScreen kind="css-formatter" />,
    "catalog-207": <DeveloperToolScreen kind="markdown-to-html" />,
    "catalog-208": <HtmlToMarkdownScreen />,
    "catalog-209": <DeveloperToolScreen kind="color-converter" />,
    "catalog-210": <DeveloperToolScreen kind="hash-generator" />,
    "json-formatter": <JsonFormatterScreen />,
    "json-minifier": <JsonMinifierScreen />,
    "json-viewer": <JsonViewerScreen />,
    "json-to-csv": <JsonToCsvScreen />,
    "csv-to-json": <CsvToJsonScreen />,
    "jwt-decoder": <JwtDecoderScreen />,
    "base64-encoder": <DeveloperToolScreen kind="base64-encoder" />,
    "base64-decoder": <DeveloperToolScreen kind="base64-decoder" />,
    "url-encoder": <DeveloperToolScreen kind="url-encoder" />,
    "url-decoder": <DeveloperToolScreen kind="url-decoder" />,
    "uuid-generator": <UuidScreen />,
    "unix-timestamp-converter": (
      <DeveloperToolScreen kind="timestamp-converter" />
    ),
    "unix-timestamp-generator": (
      <DeveloperToolScreen kind="timestamp-generator" />
    ),
    "cron-generator": <CronScreen />,
    "regex-tester": <RegexScreen />,
    "text-diff": <DeveloperToolScreen kind="text-diff" />,
    "sql-formatter": <DeveloperToolScreen kind="sql-formatter" />,
    "yaml-formatter": <DeveloperToolScreen kind="yaml-formatter" />,
    "xml-formatter": <XmlScreen />,
    "html-formatter": <DeveloperToolScreen kind="html-formatter" />,
    "css-formatter": <DeveloperToolScreen kind="css-formatter" />,
    "markdown-to-html": <DeveloperToolScreen kind="markdown-to-html" />,
    "html-to-markdown": <HtmlToMarkdownScreen />,
    "color-converter": <DeveloperToolScreen kind="color-converter" />,
    "hash-generator": <DeveloperToolScreen kind="hash-generator" />,
  };
  for (let id = 128; id <= 210; id += 1) {
    const catalogSlug = `catalog-${id}`;
    if (!map[catalogSlug])
      map[catalogSlug] = <CatalogToolScreen slug={catalogSlug} />;
  }
  const tool = getTool(slug);
  const content = map[slug] ?? <CatalogToolScreen slug={slug} />;
  return (
    <div>
      <p className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
        使用方法：{getToolUsage(tool?.name ?? "計算ツール")}
      </p>
      {content}
    </div>
  );
}
