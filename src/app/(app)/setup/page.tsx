"use client";
import { SetupView } from "@/components/SetupView";
import { useApp } from "../context";

export default function SetupPage() {
  const { extensionConnected } = useApp();
  return <SetupView extensionConnected={extensionConnected} />;
}
