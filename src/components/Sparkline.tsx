"use client";

export function Sparkline({ data, width = 120, height = 28, color = "var(--accent)" }: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const span = Math.max(1, max - min);
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => [i * stepX, height - 4 - ((v - min) / span) * (height - 8)]);
  const path = points.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const lastX = points[points.length - 1][0], lastY = points[points.length - 1][1];
  const fill = `${path} L ${width},${height} L 0,${height} Z`;
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={fill} fill={color} opacity="0.08"/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lastX} cy={lastY} r="2.2" fill={color}/>
    </svg>
  );
}
