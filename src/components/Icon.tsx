"use client";

export function Icon({ name, size = 14 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "list": return <svg {...common}><line x1="3" y1="4" x2="13" y2="4"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="3" y1="12" x2="13" y2="12"/></svg>;
    case "chart": return <svg {...common}><polyline points="2,12 6,8 9,10 14,4"/><circle cx="6" cy="8" r="1"/><circle cx="9" cy="10" r="1"/><circle cx="14" cy="4" r="1"/></svg>;
    case "gear": return <svg {...common}><circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"/></svg>;
    case "plus": return <svg {...common}><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>;
    case "search": return <svg {...common}><circle cx="7" cy="7" r="4"/><line x1="10" y1="10" x2="13" y2="13"/></svg>;
    case "edit": return <svg {...common}><path d="M11 2.5l2.5 2.5L6 12.5H3.5V10z"/></svg>;
    case "trash": return <svg {...common}><path d="M3 4.5h10M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M4.5 4.5l.5 8.5a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9l.5-8.5"/></svg>;
    case "pause": return <svg {...common}><rect x="4.5" y="3.5" width="2.5" height="9" rx="0.5"/><rect x="9" y="3.5" width="2.5" height="9" rx="0.5"/></svg>;
    case "play": return <svg {...common}><path d="M5 3.5v9l8-4.5z"/></svg>;
    case "arr": return <svg {...common}><line x1="3" y1="8" x2="13" y2="8"/><polyline points="9,4 13,8 9,12"/></svg>;
    case "x": return <svg {...common}><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>;
    case "back": return <svg {...common}><polyline points="9,3 4,8 9,13"/><line x1="4" y1="8" x2="13" y2="8"/></svg>;
    case "moon": return <svg {...common}><path d="M12.5 9.5A4.5 4.5 0 0 1 7 4.5a4.5 4.5 0 0 0 5.5 5z"/></svg>;
    case "sun": return <svg {...common}><circle cx="8" cy="8" r="2.5"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"/></svg>;
    case "filter": return <svg {...common}><path d="M2.5 3.5h11l-4 5v4l-3-1.5v-2.5z"/></svg>;
    case "refresh": return <svg {...common}><path d="M13 8a5 5 0 1 1-1.5-3.5"/><polyline points="13,2 13,5 10,5"/></svg>;
    case "check": return <svg {...common}><polyline points="3.5,8 7,11 12.5,5"/></svg>;
    default: return null;
  }
}
