"use client";
import { useState, useMemo } from "react";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Icon } from "./Icon";
import { Sparkline } from "./Sparkline";
import { useToast } from "./Toast";
import { fmtMoney, fmtDate, addDays } from "@/lib/utils";

type Filter = "all" | "active" | "paused";

interface RoutesViewProps {
  routes: Doc<"routes">[];
  onOpenHistory: (id: Id<"routes">) => void;
  onOpenEdit: (id: Id<"routes">) => void;
  onOpenNew: () => void;
  lastRunInfo?: string;
}

export function RoutesView({ routes, onOpenHistory, onOpenEdit, onOpenNew, lastRunInfo }: RoutesViewProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const toggleActive = useMutation(api.routes.toggleActive);
  const removeRoute = useMutation(api.routes.remove);
  const toast = useToast();

  const filtered = useMemo(() => {
    let list = routes;
    if (filter === "active") list = list.filter(r => r.active);
    if (filter === "paused") list = list.filter(r => !r.active);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(s) ||
        r.origin.toLowerCase().includes(s) ||
        r.destination.toLowerCase().includes(s)
      );
    }
    return list;
  }, [routes, filter, search]);

  const activeCount = routes.filter(r => r.active).length;
  const pausedCount = routes.filter(r => !r.active).length;

  const handleToggle = async (id: Id<"routes">, name: string, wasActive: boolean) => {
    await toggleActive({ id });
    toast(wasActive ? `Paused "${name}"` : `Resumed "${name}"`);
  };

  const handleDelete = async (id: Id<"routes">, name: string) => {
    await removeRoute({ id });
    toast(`Deleted "${name}"`);
  };

  const windowDates = (r: Doc<"routes">) => {
    const start = addDays(new Date(), r.windowStartDays);
    const end = addDays(start, r.windowLengthDays);
    return `${fmtDate(start)} - ${fmtDate(end)}`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Routes</h1>
          <p className="page-sub">{routes.length} route{routes.length !== 1 ? "s" : ""} tracked</p>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={onOpenNew}>
            <Icon name="plus" size={13}/> New route
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">Active</div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-sub">{pausedCount} paused</div>
        </div>
        <div className="stat">
          <div className="stat-label">Cheapest</div>
          <div className="stat-value">{"\u2014"}</div>
          <div className="stat-sub">no data yet</div>
        </div>
        <div className="stat">
          <div className="stat-label">Movers</div>
          <div className="stat-value">{"\u2014"}</div>
          <div className="stat-sub">no data yet</div>
        </div>
        <div className="stat">
          <div className="stat-label">Last updated</div>
          <div className="stat-value">{lastRunInfo || "\u2014"}</div>
          <div className="stat-sub">{lastRunInfo ? "scan complete" : "no scans yet"}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="filter-tabs">
            <div className="filter-tab" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              All<span className="n">{routes.length}</span>
            </div>
            <div className="filter-tab" aria-pressed={filter === "active"} onClick={() => setFilter("active")}>
              Active<span className="n">{activeCount}</span>
            </div>
            <div className="filter-tab" aria-pressed={filter === "paused"} onClick={() => setFilter("paused")}>
              Paused<span className="n">{pausedCount}</span>
            </div>
          </div>
          <div className="right">
            <div className="search">
              <Icon name="search" size={12}/>
              <input
                placeholder="Search routes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="route-head">
          <span>Route</span>
          <span>Name</span>
          <span>Price</span>
          <span className="col-meta1">Delta</span>
          <span className="col-meta2">Trend</span>
          <span>Status</span>
          <span/>
        </div>

        {filtered.length === 0 && (
          <div className="empty">
            <h3>No routes found</h3>
            <p>{search ? "Try a different search term." : "Add your first route to start tracking."}</p>
            {!search && (
              <button className="btn primary" onClick={onOpenNew}>
                <Icon name="plus" size={13}/> New route
              </button>
            )}
          </div>
        )}

        {filtered.map(r => (
          <div
            key={r._id}
            className={"route-row" + (r.active ? "" : " paused")}
            onClick={() => onOpenHistory(r._id)}
          >
            <div className="pair">
              <span>{r.origin}</span>
              <span className="arr"><Icon name="arr" size={12}/></span>
              <span>{r.destination}</span>
            </div>
            <div className="col-name">
              <div className="name">{r.name}</div>
              <div className="name-sub">{windowDates(r)}</div>
            </div>
            <div className="price">{"\u2014"}</div>
            <div className="col-meta1">
              <span className="delta flat">{"\u2014"}</span>
            </div>
            <div className="col-meta2">
              <Sparkline data={[]} />
            </div>
            <div>
              <span className="status">
                <span className={"dot " + (r.active ? "ok" : "paused")}/>
                {r.active ? "Active" : "Paused"}
              </span>
            </div>
            <div className="row-actions" onClick={e => e.stopPropagation()}>
              <button
                className="icon-btn"
                title={r.active ? "Pause" : "Resume"}
                onClick={() => handleToggle(r._id, r.name, r.active)}
              >
                <Icon name={r.active ? "pause" : "play"} size={12}/>
              </button>
              <button
                className="icon-btn"
                title="Edit"
                onClick={() => onOpenEdit(r._id)}
              >
                <Icon name="edit" size={12}/>
              </button>
              <button
                className="icon-btn"
                title="Delete"
                onClick={() => handleDelete(r._id, r.name)}
              >
                <Icon name="trash" size={12}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
