"use client";
import { createContext, useContext } from "react";
import { Id } from "../../../convex/_generated/dataModel";

export interface AppContextType {
  userId: Id<"users"> | null;
  extensionConnected: boolean;
  fetching: boolean;
  triggerFetch: () => void;
  lastRunInfo?: string;
}

export const AppContext = createContext<AppContextType>({
  userId: null,
  extensionConnected: false,
  fetching: false,
  triggerFetch: () => {},
});

export function useApp() {
  return useContext(AppContext);
}
