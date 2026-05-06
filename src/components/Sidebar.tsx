"use client";
import { Icon } from "./Icon";

type View = "routes" | "history" | "settings";

interface SidebarProps {
  view: View;
  setView: (v: View) => void;
  routeCount: number;
  activeCount: number;
  lastUpdated?: string;
}

export function Sidebar({ view, setView, routeCount, activeCount, lastUpdated }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">f</div>
        <div className="brand-name">ftrack</div>
        <div className="brand-meta">v0.4</div>
      </div>
      <div className="nav-section-label">Workspace</div>
      <div className="nav-item" aria-current={view === "routes" ? "page" : undefined} onClick={() => setView("routes")}>
        <Icon name="list"/> <span>Routes</span> <span className="count">{routeCount}</span>
      </div>
      <div className="nav-item" aria-current={view === "history" ? "page" : undefined} onClick={() => setView("history")}>
        <Icon name="chart"/> <span>History</span>
      </div>
      <div className="nav-item" aria-current={view === "settings" ? "page" : undefined} onClick={() => setView("settings")}>
        <Icon name="gear"/> <span>Settings</span>
      </div>
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
