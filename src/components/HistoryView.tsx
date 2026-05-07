"use client";
import { useState, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Icon } from "./Icon";
import { LineChart } from "./LineChart";
import { useToast } from "./Toast";
import { fmtMoney, fmtDate, fmtWeekday, dayOfMonth } from "@/lib/utils";
import { FlightsTable } from "./FlightsTable";

interface HistoryViewProps {
  routeId: Id<"routes">;
  onBack: () => void;
  extensionConnected?: boolean;
}

export function HistoryView({ routeId, onBack, extensionConnected }: HistoryViewProps) {
  const route = useQuery(api.routes.get, { id: routeId });
  const history = useQuery(api.quotes.getHistory, { routeId });
  const routeQuotes = useQuery(api.quotes.listByRoute, { routeId });
  const [selectedDay, setSelectedDay] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  // Per-route refresh: tell extension to fetch just this route's targets
  const refreshRoute = useCallback(() => {
    if (!extensionConnected) {
      toast("Extension required — install it to fetch prices");
      setTimeout(() => window.location.href = "/setup", 1500);
      return;
    }
    if (!routeQuotes) {
      toast("No targets to refresh");
      return;
    }
    const targetIds = routeQuotes.map(rq => rq.fetchTarget._id);
    if (targetIds.length === 0) {
      toast("No targets to refresh");
      return;
    }
    setRefreshing(true);
    toast(`Refreshing ${targetIds.length} dates...`);
    window.postMessage({ type: 'FTRACK_FETCH_ROUTE', targetIds }, '*');

    // Listen for completion
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'FTRACK_STATUS' && !event.data.fetching) {
        setRefreshing(false);
        toast("Route prices updated!");
        window.removeEventListener('message', handler);
      }
    };
    window.addEventListener('message', handler);
    // Poll status
    const poll = setInterval(() => {
      window.postMessage({ type: 'FTRACK_GET_STATUS' }, '*');
    }, 3000);
    // Timeout after 3 min
    setTimeout(() => { clearInterval(poll); setRefreshing(false); window.removeEventListener('message', handler); }, 180000);
  }, [routeQuotes, extensionConnected, toast]);

  // Build 7-day window from routeQuotes
  // Each entry in routeQuotes has a fetchTarget with departureDate and quotes
  const window7 = useMemo(() => {
    if (!routeQuotes) return [];
    return routeQuotes
      .map(rq => {
        const cheapest = rq.quotes.length > 0
          ? Math.min(...rq.quotes.map(q => q.price))
          : null;
        return {
          date: rq.fetchTarget.departureDate,
          cheapest,
          quotes: rq.quotes.sort((a, b) => a.price - b.price),
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [routeQuotes]);

  // Build history for LineChart (needs {date, cheapest, median})
  const chartHistory = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.map(h => ({
      date: h.date,
      cheapest: h.price,
      median: h.price, // median tracks cheapest until we have real median data
    }));
  }, [history]);

  if (!route) return <div className="empty"><p>Loading...</p></div>;

  // Stats
  const cheapestInWindow = window7.length > 0
    ? Math.min(...window7.filter(w => w.cheapest !== null).map(w => w.cheapest!))
    : null;
  const cheapestDate = cheapestInWindow !== null
    ? window7.find(w => w.cheapest === cheapestInWindow)?.date
    : null;

  // Today vs yesterday delta
  const currentCheapest = cheapestInWindow;
  const yesterdayPrice = chartHistory.length >= 2
    ? chartHistory[chartHistory.length - 2].cheapest
    : null;
  const delta = currentCheapest !== null && yesterdayPrice !== null
    ? currentCheapest - yesterdayPrice
    : null;

  // The flight table shows flights for the selected day
  const selectedDayData = window7[selectedDay];
  const flights = selectedDayData?.quotes || [];

  return (
    <>
      <div className="page-head">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn ghost icon" onClick={onBack} title="Back"><Icon name="back"/></button>
          <div>
            <h1 className="page-title">
              <span style={{ fontFamily: "var(--mono)", letterSpacing: "0.02em" }}>{route.origin}</span>
              <span style={{ color: "var(--fg-3)", margin: "0 10px", fontWeight: 400 }}>&rarr;</span>
              <span style={{ fontFamily: "var(--mono)", letterSpacing: "0.02em" }}>{route.destination}</span>
              <span style={{ color: "var(--fg-3)", fontWeight: 400, marginLeft: 14, fontSize: 14, letterSpacing: 0 }}>{route.name}</span>
            </h1>
            <p className="page-sub">
              {route.tripType === "round_trip" ? `Round trip \u00b7 ${route.returnAfterDays}-day return` : "One way"} &middot; {route.cabin.replace("_", " ").toLowerCase()} &middot; {route.passengers} pax &middot; tracking {route.windowLengthDays} dates
            </p>
          </div>
        </div>
        <div className="actions">
          <button className="btn" onClick={refreshRoute} disabled={refreshing}>
            <Icon name="refresh" size={13}/>{refreshing ? "Refreshing..." : "Refresh route"}
          </button>
          {!extensionConnected && (
            <a href="/setup" style={{ fontSize: 11, color: "var(--fg-3)", textDecoration: "underline" }}>
              extension required
            </a>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="stats">
        <div className="stat">
          <div className="stat-label">Cheapest in window</div>
          <div className="stat-value">{cheapestInWindow ? fmtMoney(cheapestInWindow) : "\u2014"}</div>
          <div className="stat-sub">{cheapestDate ? fmtDate(cheapestDate) : `across ${window7.length} dates`}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Today vs yesterday</div>
          <div className="stat-value mono">
            {delta === null ? <span style={{ color: "var(--fg-3)" }}>&mdash;</span> :
              delta === 0 ? <span style={{ color: "var(--fg-3)" }}>flat</span> :
              delta < 0 ? <span style={{ color: "var(--down)" }}>&darr; {fmtMoney(Math.abs(delta))}</span> :
              <span style={{ color: "var(--up)" }}>&uarr; {fmtMoney(delta)}</span>}
          </div>
          <div className="stat-sub">{currentCheapest ? `current cheapest: ${fmtMoney(currentCheapest)}` : "no data"}</div>
        </div>
        <div className="stat">
          <div className="stat-label">30-day range</div>
          <div className="stat-value mono" style={{ fontSize: 18 }}>
            {chartHistory.length > 0
              ? `${fmtMoney(Math.min(...chartHistory.map(h => h.cheapest)))} \u2013 ${fmtMoney(Math.max(...chartHistory.map(h => h.cheapest)))}`
              : "\u2014"}
          </div>
          <div className="stat-sub">{chartHistory.length > 0 ? `median ${fmtMoney(chartHistory[Math.floor(chartHistory.length / 2)].cheapest)}` : "no data"}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Last updated</div>
          <div className="stat-value mono" style={{ fontSize: 18 }}>&mdash;</div>
          <div className="stat-sub">prices refresh daily</div>
        </div>
      </div>

      {/* Line chart panel */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head">
          <div className="panel-title">Cheapest fare per day &middot; last 30 days</div>
          <div className="right">
            <div className="legend">
              <span className="legend-key"><span className="swatch"/>cheapest</span>
              <span className="legend-key median"><span className="swatch"/>median offer</span>
            </div>
          </div>
        </div>
        <div className="chart-wrap">
          {chartHistory.length > 0
            ? <LineChart history={chartHistory}/>
            : <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>No price history yet. Data appears after the first scraper run.</div>
          }
        </div>
      </div>

      {/* 7-day window panel */}
      {window7.length > 0 && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <div className="panel-title">7-day window &middot; cheapest by date</div>
          </div>
          <div className="day-grid">
            {window7.map((w, i) => {
              const median = cheapestInWindow ? cheapestInWindow * 1.1 : null;
              const cheap = median && w.cheapest ? w.cheapest <= median * 0.92 : false;
              const exp = median && w.cheapest ? w.cheapest >= median * 1.08 : false;
              return (
                <div key={i} className="day" aria-pressed={selectedDay === i} onClick={() => setSelectedDay(i)}>
                  <div className="day-date">{fmtWeekday(w.date)} &middot; {fmtDate(w.date).split(" ")[0]}</div>
                  <div className="day-day">{dayOfMonth(w.date)}</div>
                  <div className="day-price">{w.cheapest ? fmtMoney(w.cheapest) : "\u2014"}</div>
                  <span className={"pchip " + (cheap ? "cheap" : exp ? "exp" : "norm")}>
                    {w.cheapest === null ? "no data" : cheap ? "below median" : exp ? "above median" : "near median"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flights table */}
      <FlightsTable
        flights={flights}
        title={selectedDayData ? `Flights \u00b7 ${fmtWeekday(selectedDayData.date)} ${fmtDate(selectedDayData.date)}` : "Flights"}
      />

      {/* Empty state when no data */}
      {window7.length === 0 && chartHistory.length === 0 && (
        <div className="panel">
          <div className="empty">
            <h3>No flight data yet</h3>
            <p>Price data will appear here after the scraper runs. Run the scraper manually or wait for the daily schedule.</p>
          </div>
        </div>
      )}
    </>
  );
}
