"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "./Icon";

export function ExtensionBanner() {
  const [dismissed, setDismissed] = useState(true); // default hidden until we check

  useEffect(() => {
    const dismissedUntil = localStorage.getItem("ftrack_banner_dismissed_until");
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
      setDismissed(true);
    } else {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    // Dismiss for 7 days
    localStorage.setItem("ftrack_banner_dismissed_until", String(Date.now() + 7 * 86400000));
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 16px",
      marginBottom: 18,
      background: "var(--accent-soft)",
      border: "1px solid var(--accent)",
      borderRadius: "var(--radius)",
      fontSize: 13,
    }}>
      <Icon name="plus" size={14}/>
      <span style={{ flex: 1 }}>
        <strong>Install the ftrack extension</strong> to fetch flight prices from your browser.{" "}
        <Link href="/setup" style={{ color: "var(--accent)", fontWeight: 500 }}>Setup guide</Link>
        {" \u00b7 "}
        <a href="/ftrack-extension.zip" download style={{ color: "var(--accent)", fontWeight: 500 }}>Download</a>
      </span>
      <button
        onClick={dismiss}
        className="btn ghost icon"
        style={{ flexShrink: 0 }}
        title="Dismiss for 7 days"
      >
        <Icon name="x" size={12}/>
      </button>
    </div>
  );
}
