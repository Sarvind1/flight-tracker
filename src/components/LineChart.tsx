"use client";
import { useRef, useState, useEffect } from "react";
import { fmtDate } from "@/lib/utils";

interface HistoryPoint {
  date: string;
  cheapest: number;
  median: number;
}

export function LineChart({ history, height = 240 }: { history: HistoryPoint[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setW(e.contentRect.width);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  if (history.length === 0) return <div ref={ref} style={{width:"100%",height,display:"grid",placeItems:"center",color:"var(--fg-3)"}}>No data yet</div>;

  const padL = 44, padR = 16, padT = 14, padB = 28;
  const cw = Math.max(280, w);
  const innerW = cw - padL - padR;
  const innerH = height - padT - padB;
  const cheapest = history.map(h => h.cheapest);
  const median = history.map(h => h.median);
  const all = [...cheapest, ...median];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const span = Math.max(1, hi - lo);
  const yPad = span * 0.08;
  const lo2 = lo - yPad, hi2 = hi + yPad;
  const span2 = hi2 - lo2;
  const x = (i: number) => padL + (i / (history.length - 1)) * innerW;
  const y = (v: number) => padT + innerH - ((v - lo2) / span2) * innerH;
  const cheapPath = cheapest.map((v, i) => (i === 0 ? "M" : "L") + x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
  const medianPath = median.map((v, i) => (i === 0 ? "M" : "L") + x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
  const fillPath = `${cheapPath} L ${x(history.length - 1)},${padT + innerH} L ${x(0)},${padT + innerH} Z`;

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => lo2 + (i * (span2 / ticks)));
  const xTicks = history.map((h, i) => ({ i, h })).filter((_, i) => i % 5 === 0 || i === history.length - 1);

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg width={cw} height={height} style={{ display: "block" }}>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={cw - padR} y1={y(v)} y2={y(v)} stroke="var(--border-2)" strokeWidth="1" strokeDasharray={i === 0 || i === yTicks.length - 1 ? undefined : "3 3"}/>
            <text x={padL - 8} y={y(v) + 3} fill="var(--fg-3)" fontSize="10" textAnchor="end" style={{ fontFamily: "var(--mono)" }}>{"$" + Math.round(v)}</text>
          </g>
        ))}
        {xTicks.map(({ i, h }) => (
          <text key={i} x={x(i)} y={padT + innerH + 16} fill="var(--fg-3)" fontSize="10" textAnchor="middle" style={{ fontFamily: "var(--mono)" }}>
            {fmtDate(h.date)}
          </text>
        ))}
        <path d={fillPath} fill="var(--accent)" opacity="0.07"/>
        <path d={medianPath} fill="none" stroke="var(--fg-3)" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.7"/>
        <path d={cheapPath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round"/>
        {history.length > 0 && (
          <g>
            <circle cx={x(history.length - 1)} cy={y(history[history.length - 1].cheapest)} r="3.5" fill="var(--accent)"/>
            <circle cx={x(history.length - 1)} cy={y(history[history.length - 1].cheapest)} r="6" fill="var(--accent)" opacity="0.18"/>
          </g>
        )}
      </svg>
    </div>
  );
}
