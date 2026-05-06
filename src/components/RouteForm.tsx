"use client";
import { useState } from "react";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Icon } from "./Icon";
import { IataCombo } from "./IataCombo";
import { Stepper } from "./Stepper";
import { Seg } from "./Seg";
import { useToast } from "./Toast";
import { fmtDate, addDays } from "@/lib/utils";

type Cabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
type TripType = "one_way" | "round_trip";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysFromToday(dateStr: string): number {
  const today = todayMidnight();
  return Math.max(0, Math.round(
    (new Date(dateStr).getTime() - today.getTime()) / 86400000
  ));
}

const STOPS_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "0", label: "Nonstop" },
  { value: "1", label: "\u22641 stop" },
];

function stopsToSeg(v: number | undefined): string {
  if (v === 0) return "0";
  if (v === 1) return "1";
  return "any";
}

function segToStops(v: string): number | undefined {
  if (v === "0") return 0;
  if (v === "1") return 1;
  return undefined;
}

function stopsLabel(v: number | undefined): string {
  if (v === 0) return "nonstop only";
  if (v === 1) return "\u22641 stop";
  return "";
}

interface RouteFormProps {
  initial?: Doc<"routes"> | null;
  userId: Id<"users">;
  onClose: () => void;
}

export function RouteForm({ initial, userId, onClose }: RouteFormProps) {
  const defaultDate = toDateStr(addDays(todayMidnight(), 7));

  const [name, setName] = useState(initial?.name || "");
  const [origin, setOrigin] = useState(initial?.origin || "");
  const [destination, setDestination] = useState(initial?.destination || "");
  const [tripType, setTripType] = useState<TripType>(initial?.tripType || "round_trip");
  const [cabin, setCabin] = useState<Cabin>((initial?.cabin as Cabin) || "ECONOMY");
  const [passengers, setPassengers] = useState(initial?.passengers || 1);
  const [departureDate, setDepartureDate] = useState(initial?.departureDate || defaultDate);
  const [windowLengthDays, setWindowLengthDays] = useState(initial?.windowLengthDays ?? 7);
  const [returnAfterDays, setReturnAfterDays] = useState(initial?.returnAfterDays ?? 4);
  const [timeMin, setTimeMin] = useState(initial?.departureTimeMin || "");
  const [timeMax, setTimeMax] = useState(initial?.departureTimeMax || "");
  const [maxStops, setMaxStops] = useState<number | undefined>(initial?.maxStops);
  const [saving, setSaving] = useState(false);

  const createRoute = useMutation(api.routes.create);
  const updateRoute = useMutation(api.routes.update);
  const removeRoute = useMutation(api.routes.remove);
  const toast = useToast();

  const isEdit = !!initial;
  const valid = name.trim() && origin.length === 3 && destination.length === 3 && origin !== destination;

  // Derive windowStartDays from the date picker for backend compat
  const windowStartDays = daysFromToday(departureDate);
  const windowStart = new Date(departureDate);
  const windowEnd = addDays(windowStart, windowLengthDays);

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      if (isEdit && initial) {
        await updateRoute({
          id: initial._id,
          name: name.trim(),
          origin,
          destination,
          tripType,
          cabin,
          passengers,
          windowStartDays,
          windowLengthDays,
          returnAfterDays: tripType === "round_trip" ? returnAfterDays : undefined,
          departureDate,
          departureTimeMin: timeMin || undefined,
          departureTimeMax: timeMax || undefined,
          maxStops,
        });
        toast("Saved changes");
      } else {
        await createRoute({
          userId,
          name: name.trim(),
          origin,
          destination,
          tripType,
          cabin,
          passengers,
          windowStartDays,
          windowLengthDays,
          returnAfterDays: tripType === "round_trip" ? returnAfterDays : undefined,
          departureDate,
          departureTimeMin: timeMin || undefined,
          departureTimeMax: timeMax || undefined,
          maxStops,
        });
        toast(`Tracking ${origin} \u2192 ${destination}`);
      }
      onClose();
    } catch {
      toast("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (initial) {
      await removeRoute({ id: initial._id });
      toast(`Deleted "${initial.name}"`);
      onClose();
    }
  };

  // Build the summary string
  const timeRange = (timeMin && timeMax) ? `${timeMin}\u2013${timeMax}` : timeMin || timeMax || "";
  const stopsText = stopsLabel(maxStops);
  const summaryParts = [
    `${origin || "???"} \u2192 ${destination || "???"}`,
    `${fmtDate(windowStart)} \u2013 ${fmtDate(windowEnd)}`,
  ];
  if (timeRange) summaryParts.push(timeRange);
  if (stopsText) summaryParts.push(stopsText);
  if (tripType === "round_trip") summaryParts.push(`return +${returnAfterDays}d`);
  summaryParts.push(`${passengers} pax`);
  summaryParts.push(cabin.toLowerCase().replace("_", " "));

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">{isEdit ? "Edit route" : "New route"}</h2>
          <p className="modal-sub">
            {isEdit
              ? `Editing ${initial.origin} \u2192 ${initial.destination}`
              : "Set up a new flight route to track"}
          </p>
        </div>

        <div className="modal-body">
          {/* 1. Route name */}
          <div className="field">
            <label className="label">Route name</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Weekend getaway"
            />
          </div>

          {/* 2. Origin / Destination */}
          <div className="field-row">
            <div className="field">
              <label className="label">Origin</label>
              <IataCombo value={origin} onChange={setOrigin} placeholder="JFK"/>
            </div>
            <div className="field">
              <label className="label">Destination</label>
              <IataCombo value={destination} onChange={setDestination} placeholder="LAX"/>
            </div>
          </div>

          {/* 3. Trip type / Cabin */}
          <div className="field-row">
            <div className="field">
              <label className="label">Trip type</label>
              <Seg
                options={[
                  { value: "round_trip", label: "Round trip" },
                  { value: "one_way", label: "One way" },
                ]}
                value={tripType}
                onChange={v => setTripType(v as TripType)}
              />
            </div>
            <div className="field">
              <label className="label">Cabin</label>
              <select
                className="input"
                value={cabin}
                onChange={e => setCabin(e.target.value as Cabin)}
              >
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First</option>
              </select>
            </div>
          </div>

          {/* 4. Passengers / Return after days */}
          <div className="field-row">
            <div className="field">
              <label className="label">Passengers</label>
              <Stepper value={passengers} onChange={setPassengers} min={1} max={9}/>
            </div>
            {tripType === "round_trip" && (
              <div className="field">
                <label className="label">
                  Return after <span className="hint">days from departure</span>
                </label>
                <Stepper value={returnAfterDays} onChange={setReturnAfterDays} min={1} max={30}/>
              </div>
            )}
          </div>

          {/* 5. Departure date / Window length */}
          <div className="field-row">
            <div className="field">
              <label className="label">Departure date</label>
              <input
                type="date"
                className="input"
                value={departureDate}
                min={toDateStr(todayMidnight())}
                onChange={e => setDepartureDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">
                Window length <span className="hint">days</span>
              </label>
              <Stepper value={windowLengthDays} onChange={setWindowLengthDays} min={1} max={30}/>
            </div>
          </div>

          {/* 6. Departure time range */}
          <div className="field-row">
            <div className="field">
              <label className="label">Earliest departure</label>
              <input
                type="time"
                className="input"
                value={timeMin}
                onChange={e => setTimeMin(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="label">Latest departure</label>
              <input
                type="time"
                className="input"
                value={timeMax}
                onChange={e => setTimeMax(e.target.value)}
              />
            </div>
          </div>
          <p className="hint" style={{ marginTop: -4 }}>
            Time filters are applied after fetching results
          </p>

          {/* 7. Max stops */}
          <div className="field">
            <label className="label">Max stops</label>
            <Seg
              options={STOPS_OPTIONS}
              value={stopsToSeg(maxStops)}
              onChange={v => setMaxStops(segToStops(v))}
            />
          </div>

          {/* 8. Tracking summary bar */}
          <div style={{
            padding: "10px 12px",
            background: "var(--bg-2)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--fg-2)",
            fontFamily: "var(--mono)",
            marginTop: 4,
          }}>
            {summaryParts.join(" \u00B7 ")}
          </div>
        </div>

        <div className="modal-foot">
          {isEdit && (
            <button className="btn danger sm" onClick={handleDelete}>
              <Icon name="trash" size={12}/> Delete
            </button>
          )}
          <div className="right">
            <button className="btn sm" onClick={onClose}>Cancel</button>
            <button className="btn primary sm" onClick={save} disabled={!valid || saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create route"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
