import Link from "next/link";
import ToolCard from "@/components/ToolCard";
import SearchTools from "@/components/SearchTools";
import { categories, tools } from "@/lib/tools/registry";

export default function Home() {
  const popular = tools.filter((tool) => tool.popular).slice(0, 6);
  const categoryHighlights = [
    {
      slug: "work",
      label: "給与・税金",
      tools: ["手取り計算", "給与手取り計算", "所得税計算", "住民税計算"],
    },
    {
      slug: "life",
      label: "生活・交通",
      tools: [
        "住宅ローン計算",
        "家賃初期費用計算",
        "電気代計算",
        "ガソリン代計算",
      ],
    },
    {
      slug: "date",
      label: "日付・時間",
      tools: ["年齢計算", "日付差計算", "営業日計算", "日付計算"],
    },
    {
      slug: "family",
      label: "育児・家族",
      tools: [
        "出産予定日計算",
        "妊娠週数計算",
        "保育園年齢計算",
        "児童手当計算",
      ],
    },
  ];
  return (
    <main>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-16 text-center md:pt-20">
          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold tracking-wide text-blue-700">
            JAPAN LIFE TOOLS
          </span>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
            日本の生活に役立つ
            <br className="hidden md:block" />
            無料計算ツール
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            給与・税金・社会保険・生活費・日付など、日本で暮らすための計算をかんたんに。
          </p>
          <div className="mt-9">
            <SearchTools />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
            <span>人気：</span>
            <Link
              href="/tools/take-home-pay/"
              className="rounded-full bg-white px-3 py-1.5 hover:text-blue-600"
            >
              手取り
            </Link>
            <Link
              href="/tools/income-tax/"
              className="rounded-full bg-white px-3 py-1.5 hover:text-blue-600"
            >
              所得税
            </Link>
            <Link
              href="/tools/overtime-pay/"
              className="rounded-full bg-white px-3 py-1.5 hover:text-blue-600"
            >
              残業代
            </Link>
            <Link
              href="/tools/age-calculator/"
              className="rounded-full bg-white px-3 py-1.5 hover:text-blue-600"
            >
              年齢
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold text-blue-600">START HERE</p>
            <h2 className="mt-1 text-2xl font-black">まず使うならこのツール</h2>
          </div>
          <Link
            href="/tools/"
            className="inline-flex items-center gap-1 text-sm font-bold text-blue-600"
          >
            全ツールを見る
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 10h11m-5-5 5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {popular.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="mb-7">
            <p className="text-sm font-bold text-blue-600">
              BROWSE BY CATEGORY
            </p>
            <h2 className="mt-1 text-2xl font-black">
              目的から計算ツールを探す
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categoryHighlights.map((category) => {
              const count = tools.filter(
                (tool) => tool.category === category.slug,
              ).length;
              return (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}/`}
                  className="border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"
                >
                  <div className="text-2xl" aria-hidden="true">
                    {category.slug === "work"
                      ? "💰"
                      : category.slug === "date"
                        ? "📅"
                        : "🏠"}
                  </div>
                  <h3 className="mt-3 font-extrabold">{category.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {category.tools.join("・")}
                  </p>
                  <p className="mt-4 text-xs font-bold text-blue-600">
                    {count} tools を見る →
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
