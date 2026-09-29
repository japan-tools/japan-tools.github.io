"use client";

import { useState } from "react";
import { Card, Field, inputClass } from "@/components/ToolPrimitives";

function JsonAction({ mode }: { mode: "format" | "minify" | "view" }) {
  const [value, setValue] = useState(
    '{"name":"Japan Life Tools","items":[1,2,3]}',
  );
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const run = () => {
    try {
      setResult(
        JSON.stringify(JSON.parse(value), null, mode === "minify" ? 0 : 2),
      );
      setError("");
    } catch {
      setResult("");
      setError("JSONの形式が正しくありません。");
    }
  };
  const title =
    mode === "minify"
      ? "JSONを圧縮"
      : mode === "view"
        ? "JSONを表示"
        : "JSONを整形";
  return (
    <Card>
      <Field label="JSON">
        <textarea
          className={inputClass + " min-h-64 font-mono text-sm"}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
      <button
        onClick={run}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
      >
        {title}
      </button>
      <div className="mt-6">
        <Field label="結果">
          <textarea
            className={inputClass + " min-h-40 font-mono text-sm"}
            readOnly
            value={result}
            placeholder="結果がここに表示されます"
          />
        </Field>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  );
}

export function JsonFormatterScreen() {
  return <JsonAction mode="format" />;
}
export function JsonMinifierScreen() {
  return <JsonAction mode="minify" />;
}
export function JsonViewerScreen() {
  return <JsonAction mode="view" />;
}

export function JsonToCsvScreen() {
  const [value, setValue] = useState(
    '[{"name":"Alice","age":30},{"name":"Bob","age":25}]',
  );
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const convert = () => {
    try {
      const rows = JSON.parse(value);
      if (
        !Array.isArray(rows) ||
        rows.some(
          (row) =>
            typeof row !== "object" || row === null || Array.isArray(row),
        )
      )
        throw new Error();
      const keys = [
        ...new Set(
          rows.flatMap((row: Record<string, unknown>) => Object.keys(row)),
        ),
      ];
      const quote = (item: unknown) =>
        `"${String(item ?? "").replaceAll('"', '""')}"`;
      setResult(
        [
          keys,
          ...rows.map((row: Record<string, unknown>) =>
            keys.map((key) => row[key]),
          ),
        ]
          .map((row) => row.map(quote).join(","))
          .join("\n"),
      );
      setError("");
    } catch {
      setResult("");
      setError("JSON配列の各要素をオブジェクトにしてください。");
    }
  };
  return (
    <Card>
      <Field label="JSON配列">
        <textarea
          className={inputClass + " min-h-64 font-mono text-sm"}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
      <button
        onClick={convert}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
      >
        CSVに変換
      </button>
      <Field label="CSV">
        <textarea
          className={inputClass + " mt-6 min-h-40 font-mono text-sm"}
          readOnly
          value={result}
        />
      </Field>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  );
}

export function CsvToJsonScreen() {
  const [value, setValue] = useState("name,age\nAlice,30\nBob,25");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const convert = () => {
    try {
      const [headers, ...rows] = value
        .trim()
        .split(/\r?\n/)
        .map((line) => line.split(","));
      if (!headers?.length) throw new Error();
      setResult(
        JSON.stringify(
          rows.map((row) =>
            Object.fromEntries(
              headers.map((key, index) => [key, row[index] ?? ""]),
            ),
          ),
          null,
          2,
        ),
      );
      setError("");
    } catch {
      setResult("");
      setError("CSVの形式を確認してください。");
    }
  };
  return (
    <Card>
      <Field label="CSV（1行目は項目名）">
        <textarea
          className={inputClass + " min-h-64 font-mono text-sm"}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
      <button
        onClick={convert}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
      >
        JSONに変換
      </button>
      <Field label="JSON">
        <textarea
          className={inputClass + " mt-6 min-h-40 font-mono text-sm"}
          readOnly
          value={result}
        />
      </Field>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  );
}

export function JwtDecoderScreen() {
  const [token, setToken] = useState(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.signature",
  );
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const run = () => {
    try {
      const [header, payload, signature] = token.split(".");
      if (!header || !payload || !signature) throw new Error();
      const decode = (part: string) => {
        const padded =
          part.replaceAll("-", "+").replaceAll("_", "/") +
          "=".repeat((4 - (part.length % 4)) % 4);
        return JSON.stringify(
          JSON.parse(
            new TextDecoder().decode(
              Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)),
            ),
          ),
          null,
          2,
        );
      };
      setResult(
        `Header\n${decode(header)}\n\nPayload\n${decode(payload)}\n\nSignature\n${signature}`,
      );
      setError("");
    } catch {
      setResult("");
      setError("JWTの形式を確認してください。");
    }
  };
  return (
    <Card>
      <Field label="JWT Token">
        <textarea
          className={inputClass + " min-h-32 font-mono text-sm"}
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
      </Field>
      <button
        onClick={run}
        className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
      >
        JWTをデコード
      </button>
      <Field label="結果">
        <textarea
          className={inputClass + " mt-6 min-h-56 font-mono text-sm"}
          readOnly
          value={result}
        />
      </Field>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <p className="mt-4 text-xs text-slate-500">
        署名の正当性は検証しません。
      </p>
    </Card>
  );
}
