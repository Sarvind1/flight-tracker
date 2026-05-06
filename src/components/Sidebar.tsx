"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

interface SidebarProps {
  view?: string;           // kept for compat but pathname takes precedence
  setView?: (v: string) => void;  // kept for compat
  routeCount: number;
  activeCount: number;
  lastUpdated?: string;
}

export function Sidebar({ routeCount, activeCount, lastUpdated }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/" || pathname.startsWith("/route/");
    return pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">f</div>
        <div className="brand-name">ftrack</div>
        <div className="brand-meta">v0.4</div>
      </div>
      <div className="nav-section-label">Workspace</div>
      <Link href="/" style={{ textDecoration: "none" }}>
        <div className="nav-item" aria-current={isActive("/") ? "page" : undefined}>
          <Icon name="list"/> <span>Routes</span> <span className="count">{routeCount}</span>
        </div>
      </Link>
      <Link href="/settings" style={{ textDecoration: "none" }}>
        <div className="nav-item" aria-current={isActive("/settings") ? "page" : undefined}>
          <Icon name="gear"/> <span>Settings</span>
        </div>
      </Link>
      <Link href="/setup" style={{ textDecoration: "none" }}>
        <div className="nav-item" aria-current={isActive("/setup") ? "page" : undefined}>
          <Icon name="plus"/> <span>Extension</span>
        </div>
      </Link>
      <div className="nav-section-label">Status</div>
      <div className="nav-item" style={{ cursor: "default" }}>
        <span className="ico" style={{ display: "inline-block", width: 14, height: 14 }}>
          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 0 3px var(--accent-soft)", marginLeft: 3, marginTop: 3 }}/>
        </span>
        <span style={{ fontSize: 12.5 }}>Updated</span>
        <span className="count">{lastUpdated || "\u2014"}</span>
      </div>
      <div className="nav-spacer"/>
      <div className="who" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <div className="who-name" style={{ fontSize: 11.5, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>ftrack</div>
        <div className="who-sub" style={{ fontSize: 11, color: "var(--fg-2)", fontFamily: "var(--mono)" }}>{activeCount} routes tracked</div>
      </div>
    </aside>
  );
}
