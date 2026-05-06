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

declare global {
  // eslint-disable-next-line no-var
  var chrome: {
    runtime?: {
      sendMessage: (extensionId: string, message: unknown, callback: (response: any) => void) => void;
      lastError?: { message?: string };
    };
  } | undefined;
}

type View = "routes" | "history" | "settings";

function AppShell() {
  const [view, setView] = useState<View>("routes");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [editing, setEditing] = useState<Id<"routes"> | "new" | null>(null);
  const [historyRouteId, setHistoryRouteId] = useState<Id<"routes"> | null>(null);
  const [fetching, setFetching] = useState(false);
  const [extensionConnected, setExtensionConnected] = useState(false);
  const toast = useToast();

  // Detect ftrack Chrome extension on mount
  useEffect(() => {
    const tryPing = (id: string) => {
      if (typeof chrome === 'undefined' || !chrome?.runtime?.sendMessage) return;
      try {
        chrome.runtime.sendMessage(id, { type: 'PING' }, (res) => {
          if (typeof chrome !== 'undefined' && !chrome?.runtime?.lastError && res?.installed) {
            localStorage.setItem('ftrack_extension_id', id);
            setExtensionConnected(true);
            console.log('ftrack extension detected:', id);
          }
        });
      } catch {
        // Extension not available
      }
    };

    const savedId = localStorage.getItem('ftrack_extension_id');
    if (savedId) tryPing(savedId);
  }, []);

  const triggerFetch = useCallback(async () => {
    setFetching(true);
    toast("Fetching prices...");

    // Try the Chrome extension first
    const extensionId = localStorage.getItem('ftrack_extension_id');
    if (extensionId && typeof chrome !== 'undefined' && chrome?.runtime?.sendMessage) {
      try {
        const response = await new Promise<{ status?: string; installed?: boolean }>((resolve, reject) => {
          chrome!.runtime!.sendMessage(extensionId, { type: 'FETCH_NOW' }, (res) => {
            if (typeof chrome !== 'undefined' && chrome?.runtime?.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(res || {});
            }
          });
        });

        if (response.status === 'started') {
          toast("Extension is fetching prices — this takes ~2 min");
          // Poll for completion
          const poll = setInterval(async () => {
            try {
              const statusRes = await new Promise<{ fetching?: boolean }>((resolve) => {
                chrome!.runtime!.sendMessage(extensionId, { type: 'GET_STATUS' }, (res) => {
                  resolve(res || {});
                });
              });
              if (!statusRes.fetching) {
                clearInterval(poll);
                setFetching(false);
                toast("Prices updated!");
              }
            } catch {
              clearInterval(poll);
              setFetching(false);
            }
          }, 3000);
          return;
        }
      } catch {
        // Extension not available, fall through to localhost
      }
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
  }, [toast]);

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
