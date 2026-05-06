"use client";
import { useState } from "react";
import { Stepper } from "./Stepper";

interface SettingsViewProps {
  onSave?: () => void;
}

export function SettingsView({ onSave }: SettingsViewProps) {
  const [windowDays, setWindowDays] = useState(7);
  const [currency, setCurrency] = useState("USD");

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Defaults applied to every new route.</p>
        </div>
      </div>
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head"><div className="panel-title">Defaults</div></div>
        <div style={{ padding: "18px 20px", maxWidth: 520 }}>
          <div className="field-row">
            <div className="field">
              <label className="label">Default window length <span className="hint">days</span></label>
              <Stepper value={windowDays} onChange={setWindowDays} min={1} max={14}/>
            </div>
            <div className="field">
              <label className="label">Currency</label>
              <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option>USD</option><option>EUR</option><option>GBP</option><option>JPY</option>
              </select>
            </div>
          </div>
          <button className="btn primary" onClick={onSave}>Save</button>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="panel-title">Display</div></div>
        <div style={{ padding: "18px 20px", fontSize: 13, color: "var(--fg-2)" }}>
          Theme and density can be toggled using the moon/sun icon in the top bar.
        </div>
      </div>
      <div className="panel" style={{ marginTop: 18 }}>
        <div className="panel-head"><div className="panel-title">About</div></div>
        <div style={{ padding: "18px 20px", fontSize: 13, color: "var(--fg-2)" }}>
          <p style={{ margin: "0 0 8px" }}>ftrack v0.4 — flight price tracker for friends</p>
          <p style={{ margin: 0, fontFamily: "var(--mono)", fontSize: 11, color: "var(--fg-3)" }}>
            Prices via Google Flights. Southwest and some LCCs not included.
          </p>
        </div>
      </div>
    </>
  );
}
