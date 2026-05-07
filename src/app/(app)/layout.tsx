"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Icon } from "@/components/Icon";
import { ToastProvider, useToast } from "@/components/Toast";
import { AppContext } from "./context";

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [fetching, setFetching] = useState(false);
  const [extensionConnected, setExtensionConnected] = useState(false);
  const toast = useToast();

  // Extension detection via content script
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.type === "FTRACK_EXTENSION_INSTALLED") {
        setExtensionConnected(true);
      }
      if (event.data?.type === "FTRACK_STATUS") {
        if (!event.data.fetching) {
          setFetching(false);
          // Don't toast here — let the component that initiated the fetch handle it
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const triggerFetch = useCallback(async () => {
    setFetching(true);
    toast("Fetching prices...");

    if (extensionConnected) {
      window.postMessage({ type: "FTRACK_FETCH_NOW" }, "*");
      toast("Extension is fetching prices — this takes ~2 min");
      const poll = setInterval(() => {
        window.postMessage({ type: "FTRACK_GET_STATUS" }, "*");
      }, 5000);
      const handler = (event: MessageEvent) => {
        if (event.data?.type === "FTRACK_STATUS" && !event.data.fetching) {
          clearInterval(poll);
          setFetching(false);
          toast("Prices updated!");
          window.removeEventListener("message", handler);
        }
      };
      window.addEventListener("message", handler);
      setTimeout(() => {
        clearInterval(poll);
        setFetching(false);
        window.removeEventListener("message", handler);
      }, 300000);
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:4040/fetch", { method: "POST" });
      if (res.ok) {
        toast("Prices updated!");
      } else {
        toast("Fetch failed");
      }
    } catch {
      toast("No fetcher available. Install the extension.");
    }
    setFetching(false);
  }, [toast, extensionConnected]);

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // User init
  const getOrCreateUser = useMutation(api.users.getOrCreate);
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const userInitRef = useRef(false);
  useEffect(() => {
    if (userInitRef.current) return;
    userInitRef.current = true;
    getOrCreateUser({ displayName: "Default", email: "user@ftrack.app" }).then(
      setUserId
    );
  }, [getOrCreateUser]);

  const routes = useQuery(api.routes.list, userId ? { userId } : "skip");
  const latestRun = useQuery(api.quotes.getLatestRun);

  const lastRunInfo = latestRun
    ? `${Math.round((Date.now() - (latestRun.completedAt || latestRun.startedAt)) / 3600000)}h ago`
    : undefined;

  const activeRoutes = routes?.filter((r) => r.active) || [];

  // Determine current view for sidebar highlight
  const currentView =
    pathname.startsWith("/route/")
      ? "routes"
      : pathname === "/settings"
        ? "settings"
        : pathname === "/setup"
          ? "settings"
          : "routes";

  // Crumbs
  const crumbs = ["ftrack"];
  if (pathname === "/") crumbs.push("Routes");
  else if (pathname.startsWith("/route/")) crumbs.push("Routes", "History");
  else if (pathname === "/settings") crumbs.push("Settings");
  else if (pathname === "/setup") crumbs.push("Setup");

  if (!userId) {
    return (
      <div className="app">
        <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
          <div style={{ textAlign: "center", color: "var(--fg-3)" }}>
            <div
              className="brand-mark"
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                fontSize: 24,
                margin: "0 auto 16px",
              }}
            >
              f
            </div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{ userId, extensionConnected, fetching, triggerFetch, lastRunInfo }}
    >
      <div className="app">
        <Sidebar
          view={currentView as "routes" | "settings"}
          setView={(v) => {
            if (v === "routes") router.push("/");
            else if (v === "settings") router.push("/settings");
          }}
          routeCount={routes?.length || 0}
          activeCount={activeRoutes.length}
          lastUpdated={lastRunInfo}
        />
        <div className="main">
          <Topbar
            crumbs={crumbs}
            right={
              <>
                {extensionConnected && (
                  <span
                    className="pill"
                    style={{ borderColor: "var(--accent)" }}
                  >
                    <span className="dot" /> extension
                  </span>
                )}
                {!extensionConnected && (
                  <a
                    href="/setup"
                    className="btn sm"
                    style={{ textDecoration: "none" }}
                  >
                    <Icon name="plus" size={12} /> Install extension
                  </a>
                )}
                <span className="pill">
                  <span className="dot" />
                  {lastRunInfo ? `updated ${lastRunInfo}` : "no data yet"}
                </span>
                <button
                  className="btn ghost icon"
                  title="Toggle theme"
                  onClick={() =>
                    setTheme((t) => (t === "light" ? "dark" : "light"))
                  }
                >
                  <Icon name={theme === "light" ? "moon" : "sun"} />
                </button>
              </>
            }
          />
          <div className="content">{children}</div>
        </div>
      </div>
    </AppContext.Provider>
  );
}

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <AppLayout>{children}</AppLayout>
    </ToastProvider>
  );
}
