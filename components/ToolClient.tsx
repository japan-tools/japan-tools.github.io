"use client";

import { getTool } from "@/lib/tools/registry";
import { getCalculatorSpec } from "@/lib/tools/calculators";
import CalculatorScreen from "@/components/CalculatorScreen";
import { Card } from "@/components/ToolPrimitives";
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
import { DateUtilityScreen, HolidayScreen } from "@/components/DateTools";
import { ElectricityScreen } from "@/components/FinancialTools";
import { LifeCostScreen, UtilityScreen } from "@/components/HousingTools";

function getToolUsage(name: string) {
  if (name.includes("Formatter") || name.includes("Minifier"))
    return "入力欄にデータを貼り付けて、整形・圧縮ボタンを押してください。";
  if (name.includes("Regex"))
    return "正規表現とテスト対象の文字列を入力してください。";
  if (name.includes("Diff")) return "比較する2つのテキストを入力してください。";
  if (name.includes("Encoder") || name.includes("Decoder"))
    return "変換する文字列を入力して実行してください。";
  if (name.includes("Generator") || name.includes("Converter"))
    return "条件を入力して生成・変換を実行してください。";
  return "各入力欄に条件を入力すると、結果が表示されます。";
}

/** 汎用の計算フォームでは表現できない、専用UIを持つツール */
const dedicatedScreens: Record<string, React.ReactNode> = {
  "resignation-date": <DateUtilityScreen type="resignation" />,
  "japanese-era": <DateUtilityScreen type="era" />,
  zodiac: <DateUtilityScreen type="zodiac" />,
  "month-edges": <DateUtilityScreen type="month-edge" />,
  "japanese-holiday": <HolidayScreen />,
  "gas-bill": <UtilityScreen kind="gas" />,
  "water-bill": <UtilityScreen kind="water" />,
  "nhk-fee": <LifeCostScreen type="nhk" />,
  "life-cost": <LifeCostScreen type="ratio" />,
  "electricity-cost": <ElectricityScreen />,
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

/** catalog-186〜210 は専用スラッグと同じ開発者向けツール */
const developerAliases: Record<string, string> = {
  "catalog-166": "electricity-cost",
  "catalog-186": "json-formatter",
  "catalog-187": "json-minifier",
  "catalog-188": "json-viewer",
  "catalog-189": "json-to-csv",
  "catalog-190": "csv-to-json",
  "catalog-191": "jwt-decoder",
  "catalog-192": "base64-encoder",
  "catalog-193": "base64-decoder",
  "catalog-194": "url-encoder",
  "catalog-195": "url-decoder",
  "catalog-196": "uuid-generator",
  "catalog-197": "unix-timestamp-converter",
  "catalog-198": "unix-timestamp-generator",
  "catalog-199": "cron-generator",
  "catalog-200": "regex-tester",
  "catalog-201": "text-diff",
  "catalog-202": "sql-formatter",
  "catalog-203": "yaml-formatter",
  "catalog-204": "xml-formatter",
  "catalog-205": "html-formatter",
  "catalog-206": "css-formatter",
  "catalog-207": "markdown-to-html",
  "catalog-208": "html-to-markdown",
  "catalog-209": "color-converter",
  "catalog-210": "hash-generator",
};

function resolveDedicated(slug: string) {
  return dedicatedScreens[developerAliases[slug] ?? slug];
}

export default function ToolClient({ slug }: { slug: string }) {
  const tool = getTool(slug);
  const spec = getCalculatorSpec(slug);

  if (spec) {
    return <CalculatorScreen spec={spec} categoryName={tool?.categoryName} />;
  }

  const dedicated = resolveDedicated(slug);
  if (dedicated) {
    return (
      <div>
        <p className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
          使用方法：{getToolUsage(tool?.name ?? "計算ツール")}
        </p>
        {dedicated}
      </div>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-black text-slate-900">
        {tool?.name ?? "このツール"}は準備中です
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        正確な計算ロジックを実装中のため、現在このツールはご利用いただけません。
        公開までしばらくお待ちください。
      </p>
    </Card>
  );
}
