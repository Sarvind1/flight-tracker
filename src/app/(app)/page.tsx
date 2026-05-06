"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { RoutesView } from "@/components/RoutesView";
import { RouteForm } from "@/components/RouteForm";
import { ExtensionBanner } from "@/components/ExtensionBanner";
import { useApp } from "./context";

export default function RoutesPage() {
  const { userId, lastRunInfo, extensionConnected } = useApp();
  const routes = useQuery(api.routes.list, userId ? { userId } : "skip");
  const [editing, setEditing] = useState<Id<"routes"> | "new" | null>(null);
  const router = useRouter();

  // Auto-seed default route
  const createRoute = useMutation(api.routes.create);
  const seededRef = useRef(false);
  useEffect(() => {
    if (
      seededRef.current ||
      !userId ||
      routes === undefined ||
      routes.length > 0
    )
      return;
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

  if (!routes || !userId) return null;

  const editRoute =
    editing && editing !== "new"
      ? routes.find((r) => r._id === editing) || null
      : null;

  return (
    <>
      {!extensionConnected && <ExtensionBanner />}
      <RoutesView
        routes={routes}
        onOpenHistory={(id) => router.push(`/route/${id}`)}
        onOpenEdit={(id) => setEditing(id)}
        onOpenNew={() => setEditing("new")}
        lastRunInfo={lastRunInfo}
      />
      {editing && (
        <RouteForm
          initial={editRoute}
          userId={userId}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
