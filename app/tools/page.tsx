import type { Metadata } from "next";
import Link from "next/link";
import ToolCard from "@/components/ToolCard";
import SearchTools from "@/components/SearchTools";
import { categories, tools } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "無料ツール一覧",
  description:
    "給与・税金・生活費・日付など、日本生活に役立つ無料オンラインツール一覧。",
};

export default function ToolsPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <div className="max-w-3xl">
        <p className="text-sm font-bold text-blue-600">TOOL DIRECTORY</p>
        <h1 className="mt-2 text-4xl font-black">すべてのツール</h1>
        <p className="mt-4 leading-7 text-slate-600">
          給与・税金から日付、生活費、開発まで、ブラウザだけで使える無料ツールをまとめています。
        </p>
      </div>
      <div className="mt-8">
        <SearchTools />
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            href={`/categories/${c.slug}/`}
            key={c.slug}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:border-blue-300 hover:text-blue-600"
          >
            {c.name}
          </Link>
        ))}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </main>
  );
}
