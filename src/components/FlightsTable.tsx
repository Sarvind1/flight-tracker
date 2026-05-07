"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  FilterFn,
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

const airlineFilterFn: FilterFn<Flight> = (row, columnId, filterValue: string[]) => {
  if (!filterValue || filterValue.length === 0) return true;
  return filterValue.includes(row.getValue(columnId));
};

const stopsFilterFn: FilterFn<Flight> = (row, columnId, filterValue: number) => {
  if (filterValue === -1) return true;
  const stops = row.getValue(columnId) as number;
  return stops <= filterValue;
};

const priceRangeFilterFn: FilterFn<Flight> = (row, columnId, filterValue: [number | null, number | null]) => {
  if (!filterValue) return true;
  const price = row.getValue(columnId) as number;
  const [min, max] = filterValue;
  if (min !== null && price < min) return false;
  if (max !== null && price > max) return false;
  return true;
};

const columnHelper = createColumnHelper<Flight>();

const columns = [
  columnHelper.accessor("airline", {
    header: "Airline",
    filterFn: airlineFilterFn,
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
      const d = new Date(v);
      if (!isNaN(d.getTime())) {
        return <span className="mono">{d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>;
      }
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
    filterFn: stopsFilterFn,
    cell: info => {
      const s = info.getValue();
      return <span className="mono">{s === 0 ? "nonstop" : s + " stop" + (s > 1 ? "s" : "")}</span>;
    },
  }),
  columnHelper.accessor("price", {
    header: "Price",
    filterFn: priceRangeFilterFn,
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
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAirlineDropdown, setShowAirlineDropdown] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const airlineRef = useRef<HTMLDivElement>(null);

  const uniqueAirlines = useMemo(() => {
    return [...new Set(flights.map(f => f.airline))].sort();
  }, [flights]);

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

  // Close airline dropdown on outside click
  useEffect(() => {
    if (!showAirlineDropdown) return;
    function handleClick(e: MouseEvent) {
      if (airlineRef.current && !airlineRef.current.contains(e.target as Node)) {
        setShowAirlineDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAirlineDropdown]);

  const table = useReactTable({
    data: flights,
    columns,
    state: { sorting, columnVisibility, columnFilters },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Derive current filter values
  const selectedAirlines: string[] = (columnFilters.find(f => f.id === "airline")?.value as string[]) || [];
  const stopsFilter: number = (columnFilters.find(f => f.id === "stops")?.value as number) ?? -1;
  const priceRange: [number | null, number | null] = (columnFilters.find(f => f.id === "price")?.value as [number | null, number | null]) || [null, null];

  function setAirlineFilter(airlines: string[]) {
    setColumnFilters(prev => {
      const rest = prev.filter(f => f.id !== "airline");
      if (airlines.length === 0) return rest;
      return [...rest, { id: "airline", value: airlines }];
    });
  }

  function setStopsFilterValue(value: number) {
    setColumnFilters(prev => {
      const rest = prev.filter(f => f.id !== "stops");
      if (value === -1) return rest;
      return [...rest, { id: "stops", value }];
    });
  }

  function setPriceRangeFilter(min: number | null, max: number | null) {
    setColumnFilters(prev => {
      const rest = prev.filter(f => f.id !== "price");
      if (min === null && max === null) return rest;
      return [...rest, { id: "price", value: [min, max] }];
    });
  }

  function toggleAirline(airline: string) {
    const current = [...selectedAirlines];
    const idx = current.indexOf(airline);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(airline);
    }
    setAirlineFilter(current);
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">{title || "Flights"}</div>
        <div className="right" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="muted mono" style={{ fontSize: 11 }}>
            {table.getFilteredRowModel().rows.length} of {flights.length} offers
          </span>
          {/* Filters toggle */}
          <button className="btn sm" onClick={() => setShowFilters(f => !f)}>
            <Icon name="filter" size={12}/>
            {" "}Filters
            {columnFilters.length > 0 && (
              <span style={{
                background: "var(--accent)", color: "var(--bg)",
                borderRadius: 999, padding: "0 5px", fontSize: 10, fontWeight: 600, marginLeft: 4,
              }}>
                {columnFilters.length}
              </span>
            )}
          </button>
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

      {/* Filter bar */}
      {showFilters && (
        <div style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 12,
        }}>
          {/* Airline multi-select */}
          <div ref={airlineRef} style={{ position: "relative" }}>
            <button
              className="btn sm"
              onClick={() => setShowAirlineDropdown(d => !d)}
              style={{ fontSize: 12 }}
            >
              Airline
              {selectedAirlines.length > 0 && (
                <span style={{
                  background: "var(--accent)", color: "var(--bg)",
                  borderRadius: 999, padding: "0 5px", fontSize: 10, fontWeight: 600, marginLeft: 4,
                }}>
                  {selectedAirlines.length}
                </span>
              )}
            </button>
            {showAirlineDropdown && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                boxShadow: "0 8px 24px -8px oklch(0 0 0 / 0.18)",
                padding: 8,
                zIndex: 10,
                minWidth: 160,
              }}>
                {uniqueAirlines.map(airline => (
                  <label
                    key={airline}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 6px",
                      fontSize: 12,
                      cursor: "pointer",
                      color: "var(--fg-2)",
                      borderRadius: 4,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAirlines.includes(airline)}
                      onChange={() => toggleAirline(airline)}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    {airline}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Stops pills */}
          <div className="seg">
            <button
              aria-pressed={stopsFilter === -1}
              onClick={() => setStopsFilterValue(-1)}
              style={{ fontSize: 12 }}
            >
              All
            </button>
            <button
              aria-pressed={stopsFilter === 0}
              onClick={() => setStopsFilterValue(0)}
              style={{ fontSize: 12 }}
            >
              Nonstop
            </button>
            <button
              aria-pressed={stopsFilter === 1}
              onClick={() => setStopsFilterValue(1)}
              style={{ fontSize: 12 }}
            >
              {"\u2264"}1 stop
            </button>
          </div>

          {/* Price range */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--fg-3)" }}>$</span>
            <input
              type="number"
              className="input"
              placeholder="min"
              style={{ width: 70, fontSize: 12 }}
              value={priceRange[0] ?? ""}
              onChange={e => {
                const v = e.target.value === "" ? null : Number(e.target.value);
                setPriceRangeFilter(v, priceRange[1]);
              }}
            />
            <span style={{ color: "var(--fg-3)" }}>{"\u2013"}</span>
            <input
              type="number"
              className="input"
              placeholder="max"
              style={{ width: 70, fontSize: 12 }}
              value={priceRange[1] ?? ""}
              onChange={e => {
                const v = e.target.value === "" ? null : Number(e.target.value);
                setPriceRangeFilter(priceRange[0], v);
              }}
            />
          </div>

          {/* Clear all */}
          {columnFilters.length > 0 && (
            <button className="btn sm" onClick={() => setColumnFilters([])}>
              Clear all
            </button>
          )}
        </div>
      )}

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
