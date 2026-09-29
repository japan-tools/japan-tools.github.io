"use client";

import { useState } from "react";
import { Card, Field, inputClass } from "@/components/ToolPrimitives";

export type DeveloperToolKind =
  | "base64-encoder"
  | "base64-decoder"
  | "url-encoder"
  | "url-decoder"
  | "timestamp-converter"
  | "timestamp-generator"
  | "text-diff"
  | "sql-formatter"
  | "yaml-formatter"
  | "html-formatter"
  | "css-formatter"
  | "markdown-to-html"
  | "color-converter"
  | "hash-generator";

export function DeveloperToolScreen({ kind }: { kind: DeveloperToolKind }) {
  const [value, setValue] = useState("");
  const [second, setSecond] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const run = async () => {
    try {
      let output = "";
      if (kind === "base64-encoder")
        output = btoa(unescape(encodeURIComponent(value)));
      else if (kind === "base64-decoder")
        output = decodeURIComponent(escape(atob(value)));
      else if (kind === "url-encoder") output = encodeURIComponent(value);
      else if (kind === "url-decoder") output = decodeURIComponent(value);
      else if (kind === "timestamp-converter")
        output = new Date(Number(value) * 1000).toISOString();
      else if (kind === "timestamp-generator")
        output = String(Math.floor(Date.now() / 1000));
      else if (kind === "text-diff")
        output =
          value === second
            ? "変更なし"
            : `--- 入力1\n${value}\n+++ 入力2\n${second}`;
      else if (kind === "sql-formatter")
        output = value
          .replace(/\s+/g, " ")
          .replace(
            /\b(FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|VALUES|SET)\b/gi,
            "\n$1",
          )
          .trim();
      else if (kind === "yaml-formatter")
        output = value
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .join("\n");
      else if (kind === "html-formatter")
        output = value
          .replace(/>\s*</g, ">\n<")
          .split("\n")
          .map((line) => line.trim())
          .join("\n");
      else if (kind === "css-formatter")
        output = value
          .replace(/\s*{\s*/g, " {\n  ")
          .replace(/;\s*/g, ";\n  ")
          .replace(/\s*}/g, "\n}\n")
          .trim();
      else if (kind === "markdown-to-html")
        output = value
          .replace(/^### (.*)$/gm, "<h3>$1</h3>")
          .replace(/^## (.*)$/gm, "<h2>$1</h2>")
          .replace(/^# (.*)$/gm, "<h1>$1</h1>")
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\n\n/g, "</p><p>");
      else if (kind === "color-converter") {
        const hex = value.trim().replace("#", "");
        if (!/^[\da-f]{6}$/i.test(hex)) throw new Error();
        const [r, g, b] = [0, 2, 4].map((index) =>
          parseInt(hex.slice(index, index + 2), 16),
        );
        output = `RGB: rgb(${r}, ${g}, ${b})\nHEX: #${hex.toUpperCase()}`;
      } else if (kind === "hash-generator") {
        output = Array.from(
          new Uint8Array(
            await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(value),
            ),
          ),
          (byte) => byte.toString(16).padStart(2, "0"),
        ).join("");
      }
      setResult(output);
      setError("");
    } catch {
      setResult("");
      setError("入力形式を確認してください。");
    }
  };
  const title = kind.replaceAll("-", " ");
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={title}>
          <textarea
            className={inputClass + " min-h-56 font-mono text-sm"}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        {kind === "text-diff" && (
          <Field label="比較対象">
            <textarea
              className={inputClass + " min-h-56 font-mono text-sm"}
              value={second}
              onChange={(event) => setSecond(event.target.value)}
            />
          </Field>
        )}
      </div>
      <button
        onClick={run}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
      >
        実行
      </button>
      {result && (
        <Field label="結果">
          <textarea
            className={inputClass + " mt-6 min-h-40 font-mono text-sm"}
            readOnly
            value={result}
          />
        </Field>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  );
}

export function CronScreen() {
  const [fields, setFields] = useState(["0", "9", "*", "*", "1-5"]);
  const labels = [
    "分（0-59）",
    "時（0-23）",
    "日（1-31）",
    "月（1-12）",
    "曜日（0-7）",
  ];
  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {fields.map((value, index) => (
          <Field key={labels[index]} label={labels[index]}>
            <input
              className={inputClass}
              value={value}
              onChange={(event) =>
                setFields((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? event.target.value : item,
                  ),
                )
              }
            />
          </Field>
        ))}
      </div>
      <div className="mt-7 rounded-xl bg-slate-50 p-4 text-center font-mono text-2xl text-blue-700">
        {fields.join(" ")}
      </div>
    </Card>
  );
}

export function UuidScreen() {
  const [count, setCount] = useState("1");
  const [result, setResult] = useState("");
  return (
    <Card>
      <div className="flex flex-wrap items-end gap-4">
        <Field label="生成数量">
          <input
            className={inputClass + " w-32"}
            type="number"
            min="1"
            max="20"
            value={count}
            onChange={(event) => setCount(event.target.value)}
          />
        </Field>
        <button
          onClick={() =>
            setResult(
              Array.from(
                { length: Math.min(20, Math.max(1, Number(count) || 1)) },
                () => crypto.randomUUID(),
              ).join("\n"),
            )
          }
          className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white"
        >
          UUIDを生成
        </button>
      </div>
      {result && (
        <Field label="生成結果">
          <textarea
            className={inputClass + " mt-6 min-h-28 font-mono text-sm"}
            readOnly
            value={result}
          />
        </Field>
      )}
    </Card>
  );
}

export function RegexScreen() {
  const [pattern, setPattern] = useState("\\d+");
  const [text, setText] = useState("注文番号: 12345、受付番号: 67890");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const run = () => {
    try {
      setResult(
        Array.from(
          text.matchAll(new RegExp(pattern, "g")),
          (match) => match[0],
        ).join("\n") || "一致なし",
      );
      setError("");
    } catch {
      setResult("");
      setError("正規表現を確認してください。");
    }
  };
  return (
    <Card>
      <Field label="正規表現">
        <input
          className={inputClass + " font-mono"}
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
        />
      </Field>
      <Field label="テスト対象">
        <textarea
          className={inputClass + " mt-4 min-h-40 font-mono text-sm"}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </Field>
      <button
        onClick={run}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white"
      >
        テストする
      </button>
      {result && (
        <Field label="一致結果">
          <textarea
            className={inputClass + " mt-6 min-h-28 font-mono text-sm"}
            readOnly
            value={result}
          />
        </Field>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  );
}

export function XmlScreen() {
  const [value, setValue] = useState(
    "<root><item>Japan Life Tools</item></root>",
  );
  const [error, setError] = useState("");
  const format = () => {
    const document = new DOMParser().parseFromString(value, "application/xml");
    if (document.querySelector("parsererror")) {
      setError("XMLの形式が正しくありません。");
      return;
    }
    let depth = 0;
    setValue(
      new XMLSerializer()
        .serializeToString(document)
        .replace(/></g, ">\n<")
        .split("\n")
        .map((line) => {
          const item = line.trim();
          if (item.startsWith("</")) depth = Math.max(0, depth - 1);
          const output = `${"  ".repeat(depth)}${item}`;
          if (/^<[^!?/][^>]*[^/]>(?!.*<\/)/.test(item)) depth += 1;
          return output;
        })
        .join("\n"),
    );
    setError("");
  };
  return (
    <Card>
      <Field label="XML">
        <textarea
          className={inputClass + " min-h-72 font-mono text-sm"}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
      <button
        onClick={format}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white"
      >
        整形
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  );
}

export function HtmlToMarkdownScreen() {
  const [value, setValue] = useState(
    "<h1>Japan Life Tools</h1><p>Useful <strong>daily</strong> calculators.</p>",
  );
  const [markdown, setMarkdown] = useState("");
  const convertNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE)
      return node.textContent?.replace(/\s+/g, " ") ?? "";
    if (!(node instanceof Element)) return "";
    const content = Array.from(node.childNodes)
      .map(convertNode)
      .join("")
      .trim();
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag))
      return `${"#".repeat(Number(tag[1]))} ${content}\n\n`;
    if (["p", "div", "section"].includes(tag)) return `${content}\n\n`;
    if (["strong", "b"].includes(tag)) return `**${content}**`;
    if (["em", "i"].includes(tag)) return `*${content}*`;
    if (tag === "a") return `[${content}](${node.getAttribute("href") ?? ""})`;
    if (tag === "br") return "\n";
    if (tag === "pre")
      return `\n\`\`\`\n${node.textContent?.trim() ?? ""}\n\`\`\`\n\n`;
    if (tag === "img")
      return `![${node.getAttribute("alt") ?? ""}](${node.getAttribute("src") ?? ""})`;
    if (tag === "li") return `- ${content}\n`;
    return content;
  };
  const convert = () =>
    setMarkdown(
      Array.from(
        new DOMParser().parseFromString(value, "text/html").body.childNodes,
      )
        .map(convertNode)
        .join("")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
    );
  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="HTML">
          <textarea
            className={inputClass + " min-h-72 font-mono text-sm"}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        <Field label="Markdown">
          <textarea
            className={inputClass + " min-h-72 font-mono text-sm"}
            readOnly
            value={markdown}
          />
        </Field>
      </div>
      <button
        onClick={convert}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
      >
        Markdownに変換
      </button>
    </Card>
  );
}
