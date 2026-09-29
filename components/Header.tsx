"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="text-xl font-black tracking-tight text-slate-950"
        >
          Japan Life <span className="text-blue-600">Tools</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/tools/" className="hover:text-blue-600">
            ツール一覧
          </Link>
          <Link href="/categories/work/" className="hover:text-blue-600">
            給与・税金
          </Link>
          <Link href="/categories/life/" className="hover:text-blue-600">
            生活・交通
          </Link>
          <Link href="/categories/family/" className="hover:text-blue-600">
            育児・家族
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/about/"
            className="hidden text-sm font-semibold text-slate-600 hover:text-blue-600 lg:block"
          >
            このサイトについて
          </Link>
          <button
            type="button"
            className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav
          className="border-t border-slate-100 px-5 py-3 md:hidden"
          aria-label="モバイルメニュー"
        >
          <div className="mx-auto flex max-w-6xl flex-col text-sm font-semibold text-slate-600">
            <Link
              href="/tools/"
              className="border-b border-slate-100 py-3 hover:text-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              ツール一覧
            </Link>
            <Link
              href="/categories/work/"
              className="border-b border-slate-100 py-3 hover:text-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              給与・税金
            </Link>
            <Link
              href="/categories/life/"
              className="border-b border-slate-100 py-3 hover:text-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              生活・交通
            </Link>
            <Link
              href="/categories/family/"
              className="border-b border-slate-100 py-3 hover:text-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              育児・家族
            </Link>
            <Link
              href="/categories/date/"
              className="border-b border-slate-100 py-3 hover:text-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              日付・時間
            </Link>
            <Link
              href="/categories/money/"
              className="border-b border-slate-100 py-3 hover:text-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              お金・節約
            </Link>
            <Link
              href="/about/"
              className="py-3 hover:text-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              このサイトについて
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
