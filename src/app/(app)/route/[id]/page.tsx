"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Id } from "../../../../../convex/_generated/dataModel";
import { HistoryView } from "@/components/HistoryView";
import { useApp } from "../../context";

export default function RouteHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { extensionConnected } = useApp();

  return (
    <HistoryView
      routeId={id as Id<"routes">}
      onBack={() => router.push("/")}
      extensionConnected={extensionConnected}
    />
  );
}
