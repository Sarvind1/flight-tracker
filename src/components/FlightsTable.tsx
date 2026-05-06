"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { Icon } from "./Icon";
import { fmtMoney, formatDuration } from "@/lib/utils";

interface Flight {
  airline: string;
  flightNumber?: string | null;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: number;
  price: number;
}

const columnHelper = createColumnHelper<Flight>();

const columns = [
  columnHelper.accessor("airline", {
    header: "Airline",
    cell: info => (
      <div className="airline-cell">
        <div className="airline-mark">{(info.getValue() || "?").slice(0, 2).toUpperCase()}</div>
        <div>{info.getValue()}</div>
      </div>
    ),
  }),
  columnHelper.accessor("flightNumber", {
    header: "Flight #",
    cell: info => <span className="mono">{info.getValue() || "\u2014"}</span>,
  }),
  columnHelper.accessor("departureTime", {
    header: "Depart",
    cell: info => {
      const v = info.getValue();
      if (!v) return "\u2014";
      // Try ISO parse first, fall back to showing raw text (e.g. "7:55 PM on Fri, Jul 10")
      const d = new Date(v);
      if (!isNaN(d.getTime())) {
        return <span className="mono">{d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>;
      }
      // Extract time from raw format like "7:55 PM on..."
      const m = v.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
      return <span className="mono">{m ? m[1] : v}</span>;
    },
  }),
  columnHelper.accessor("arrivalTime", {
    header: "Arrive",
    cell: info => {
      const v = info.getValue();
      if (!v) return "\u2014";
      const d = new Date(v);
      if (!isNaN(d.getTime())) {
        return <span className="mono">{d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>;
      }
      const m = v.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
      return <span className="mono">{m ? m[1] : v}</span>;
    },
  }),
  columnHelper.accessor("durationMinutes", {
    header: "Duration",
    cell: info => <span className="mono">{formatDuration(info.getValue())}</span>,
  }),
  columnHelper.accessor("stops", {
    header: "Stops",
    cell: info => {
      const s = info.getValue();
      return <span className="mono">{s === 0 ? "nonstop" : s + " stop" + (s > 1 ? "s" : "")}</span>;
    },
  }),
  columnHelper.accessor("price", {
    header: "Price",
    cell: info => (
      <span className="mono" style={{ fontWeight: 600 }}>
        {fmtMoney(info.getValue())}
      </span>
    ),
    meta: { align: "right" },
  }),
];

interface FlightsTableProps {
  flights: Flight[];
  title?: string;
}

export function FlightsTable({ flights, title }: FlightsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "price", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    flightNumber: false,
    arrivalTime: false,
  });
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close column picker on outside click
  useEffect(() => {
    if (!showColumnPicker) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowColumnPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showColumnPicker]);

  const table = useReactTable({
    data: flights,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">{title || "Flights"}</div>
        <div className="right" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="muted mono" style={{ fontSize: 11 }}>{flights.length} offers</span>
          {/* Column picker */}
          <div ref={pickerRef} style={{ position: "relative" }}>
            <button
              className="btn sm"
              onClick={() => setShowColumnPicker(p => !p)}
              title="Toggle columns"
            >
              <Icon name="filter" size={12}/> Columns
            </button>
            {showColumnPicker && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 8px 24px -8px oklch(0 0 0 / 0.18)",
                padding: 8,
                zIndex: 10,
                minWidth: 160,
              }}>
                {table.getAllLeafColumns().map(column => (
                  <label
                    key={column.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 6px",
                      fontSize: 12,
                      cursor: column.id === "price" ? "default" : "pointer",
                      color: "var(--fg-2)",
                      borderRadius: 4,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      disabled={column.id === "price"}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <table className="flight-table">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{
                    cursor: "pointer",
                    userSelect: "none",
                    textAlign: (header.column.columnDef.meta as any)?.align || "left",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" ? " \u2191" :
                     header.column.getIsSorted() === "desc" ? " \u2193" : ""}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  style={{
                    textAlign: (cell.column.columnDef.meta as any)?.align || "left",
                    color: i === 0 && cell.column.id === "price" ? "var(--down)" : undefined,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {flights.length === 0 && (
        <div className="empty">
          <p>No flights for this date yet.</p>
        </div>
      )}
    </div>
  );
}
