import type { Metadata } from "next";
import GiscusDiscussion from "./GiscusDiscussion";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "Japan Life Toolsへのお問い合わせ方法です。",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <div className="mb-10">
        <p className="text-sm font-bold text-blue-600">CONTACT</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          お問い合わせ
        </h1>
      </div>
      <GiscusDiscussion />
    </main>
  );
}
