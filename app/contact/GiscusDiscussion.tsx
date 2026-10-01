"use client";

import { useEffect, useRef } from "react";

export default function GiscusDiscussion() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", "japan-tools/japan-tools.github.io");
    script.setAttribute("data-repo-id", "R_kgDOUqSipQ");
    script.setAttribute("data-category", "Q&A");
    script.setAttribute("data-category-id", "DIC_kwDOUqSipc4DGxmF");
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", "ja");
    container.appendChild(script);

    return () => container.replaceChildren();
  }, []);

  return <div ref={containerRef} className="giscus min-h-24" />;
}
