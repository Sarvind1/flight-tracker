"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Icon } from "@/components/Icon";
import { ToastProvider, useToast } from "@/components/Toast";
import { RoutesView } from "@/components/RoutesView";
import { RouteForm } from "@/components/RouteForm";
import { HistoryView } from "@/components/HistoryView";
import { SettingsView } from "@/components/SettingsView";

type View = "routes" | "history" | "settings";

function AppShell() {
  const [view, setView] = useState<View>("routes");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [editing, setEditing] = useState<Id<"routes"> | "new" | null>(null);
  const [historyRouteId, setHistoryRouteId] = useState<Id<"routes"> | null>(null);
  const [fetching, setFetching] = useState(false);
  const [extensionConnected, setExtensionConnected] = useState(false);
  const toast = useToast();

  // Detect ftrack Chrome extension via content script postMessage
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.type === 'FTRACK_EXTENSION_INSTALLED') {
        setExtensionConnected(true);
        console.log('ftrack extension detected:', event.data.extensionId);
      }
      if (event.data?.type === 'FTRACK_FETCH_STARTED') {
        // Extension acknowledged fetch request
      }
      if (event.data?.type === 'FTRACK_STATUS') {
        if (!event.data.fetching) {
          setFetching(false);
          toast("Prices updated!");
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [toast]);

  const triggerFetch = useCallback(async () => {
    setFetching(true);
    toast("Fetching prices...");

    // Try the Chrome extension first (via content script postMessage)
    if (extensionConnected) {
      window.postMessage({ type: 'FTRACK_FETCH_NOW' }, '*');
      toast("Extension is fetching prices — this takes ~2 min");
      // Poll for completion
      const poll = setInterval(() => {
        window.postMessage({ type: 'FTRACK_GET_STATUS' }, '*');
      }, 5000);
      // Auto-clear poll after 5 min
      setTimeout(() => { clearInterval(poll); setFetching(false); }, 300000);
      return;
    }

    // Fallback: try localhost scraper server
    try {
      const res = await fetch("http://127.0.0.1:4040/fetch", { method: "POST" });
      if (res.ok) {
        toast("Prices updated!");
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Fetch failed");
      }
    } catch {
      toast("No fetcher available. Install the ftrack extension or start the scraper.");
    }
    setFetching(false);
  }, [toast, extensionConnected]);

  // Theme toggle
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Get or create default user
  const getOrCreateUser = useMutation(api.users.getOrCreate);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const userInitRef = useRef(false);

  useEffect(() => {
    if (userInitRef.current) return;
    userInitRef.current = true;
    getOrCreateUser({ displayName: "Default", email: "user@ftrack.app" }).then(setUserId);
  }, [getOrCreateUser]);

  // Query routes
  const routes = useQuery(api.routes.list, userId ? { userId } : "skip");
  const latestRun = useQuery(api.quotes.getLatestRun);

  // Auto-seed default route: JFK -> MIA, Jul 10-17 2026
  const createRoute = useMutation(api.routes.create);
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !userId || routes === undefined || routes.length > 0) return;
    seededRef.current = true;
    createRoute({
      userId,
      name: "NYC to Miami",
      origin: "JFK",
      destination: "MIA",
      tripType: "one_way",
      windowStartDays: 64,
      windowLengthDays: 7,
      cabin: "ECONOMY",
      passengers: 1,
    });
  }, [userId, routes, createRoute]);

  // Crumbs
  const crumbs = ["ftrack"];
  if (view === "routes") crumbs.push("Routes");
  else if (view === "history") crumbs.push("Routes", "History");
  else if (view === "settings") crumbs.push("Settings");

  // Last run info
  const lastRunInfo = latestRun
    ? `${Math.round((Date.now() - (latestRun.completedAt || latestRun.startedAt)) / 3600000)}h ago`
    : undefined;

  const activeRoutes = routes?.filter(r => r.active) || [];

  if (!userId) {
    return (
      <div className="app">
        <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
          <div style={{ textAlign: "center", color: "var(--fg-3)" }}>
            <div className="brand-mark" style={{ width: 48, height: 48, borderRadius: 14, fontSize: 24, margin: "0 auto 16px" }}>f</div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const editRoute = editing && editing !== "new" ? routes?.find(r => r._id === editing) || null : null;

  return (
    <div className="app">
      <Sidebar
        view={view === "history" ? "routes" : view}
        setView={(v) => { setView(v as View); setHistoryRouteId(null); }}
        routeCount={routes?.length || 0}
        activeCount={activeRoutes.length}
        lastUpdated={lastRunInfo}
      />
      <div className="main">
        <Topbar
          crumbs={crumbs}
          right={<>
            <button className="btn" onClick={triggerFetch} disabled={fetching} title="Fetch latest prices">
              <Icon name="refresh" size={13}/>{fetching ? "Fetching..." : "Fetch now"}
            </button>
            {extensionConnected && (
              <span className="pill" style={{ borderColor: 'var(--accent)' }}>
                <span className="dot"/> extension
              </span>
            )}
            <span className="pill">
              <span className="dot"/>{lastRunInfo ? `updated ${lastRunInfo}` : "no data yet"}
            </span>
            <button className="btn ghost icon" title="Toggle theme" onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>
              <Icon name={theme === "light" ? "moon" : "sun"}/>
            </button>
          </>}
        />
        <div className="content">
          {view === "routes" && routes && (
            <RoutesView
              routes={routes}
              onOpenHistory={(id) => { setHistoryRouteId(id); setView("history"); }}
              onOpenEdit={(id) => setEditing(id)}
              onOpenNew={() => setEditing("new")}
              lastRunInfo={lastRunInfo}
            />
          )}
          {view === "history" && historyRouteId && (
            <HistoryView
              routeId={historyRouteId}
              onBack={() => { setView("routes"); setHistoryRouteId(null); }}
              extensionConnected={extensionConnected}
            />
          )}
          {view === "history" && !historyRouteId && (
            <div className="empty">
              <h3>Pick a route</h3>
              <p>Open a route from the list to see its price history.</p>
              <button className="btn primary" onClick={() => setView("routes")}>Go to routes</button>
            </div>
          )}
          {view === "settings" && (
            <SettingsView/>
          )}
        </div>
      </div>

      {editing && (
        <RouteForm
          initial={editRoute}
          userId={userId}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <AppShell/>
    </ToastProvider>
  );
}
