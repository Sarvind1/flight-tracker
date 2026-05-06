"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { AIRPORTS } from "@/lib/iata";

export function IataCombo({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value || "");
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQ(value || ""); }, [value]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return AIRPORTS.slice(0, 8);
    return AIRPORTS.filter(a =>
      a.iata.toLowerCase().includes(s) ||
      a.city.toLowerCase().includes(s) ||
      a.name.toLowerCase().includes(s)
    ).slice(0, 8);
  }, [q]);

  const pick = (a: typeof AIRPORTS[0]) => { onChange(a.iata); setQ(a.iata); setOpen(false); };

  return (
    <div className="combo" ref={ref}>
      <input
        className="input mono"
        placeholder={placeholder || "SFO"}
        value={q}
        onChange={e => { setQ(e.target.value.toUpperCase().slice(0, 40)); setOpen(true); setActive(0); onChange(e.target.value.toUpperCase()); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(matches.length - 1, a + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
          else if (e.key === "Enter") { if (matches[active]) { e.preventDefault(); pick(matches[active]); } }
          else if (e.key === "Escape") setOpen(false);
        }}
        style={{ textTransform: "uppercase" }}
      />
      {open && matches.length > 0 && (
        <div className="combo-list" role="listbox">
          {matches.map((a, i) => (
            <div
              key={a.iata}
              className={"combo-item" + (i === active ? " active" : "")}
              onMouseEnter={() => setActive(i)}
              onMouseDown={e => { e.preventDefault(); pick(a); }}
            >
              <span className="combo-iata">{a.iata}</span>
              <span className="combo-name">{a.name}</span>
              <span className="combo-city">{a.city}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
