"use client";
import { Icon } from "./Icon";

interface SetupViewProps {
  extensionConnected: boolean;
}

export function SetupView({ extensionConnected }: SetupViewProps) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Extension Setup</h1>
          <p className="page-sub">Install the ftrack Chrome extension to fetch flight prices from your browser.</p>
        </div>
      </div>

      {extensionConnected && (
        <div className="panel" style={{ marginBottom: 18, borderColor: "var(--accent)" }}>
          <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent-soft)", display: "grid", placeItems: "center" }}>
              <Icon name="check" size={16}/>
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Extension connected</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>Prices are being fetched from your browser. You're all set.</div>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Download */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head">
          <div className="panel-title">Step 1 — Download</div>
        </div>
        <div style={{ padding: "20px 20px" }}>
          <p style={{ fontSize: 13, color: "var(--fg-2)", margin: "0 0 14px" }}>
            Download the extension package. It's a small zip file (~10 KB) that contains everything needed.
          </p>
          <a
            href="/ftrack-extension.zip"
            download
            className="btn primary"
            style={{ textDecoration: "none", display: "inline-flex" }}
          >
            <Icon name="arr" size={13}/> Download ftrack-extension.zip
          </a>
        </div>
      </div>

      {/* Step 2: Unzip */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head">
          <div className="panel-title">Step 2 — Unzip</div>
        </div>
        <div style={{ padding: "20px 20px" }}>
          <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0 }}>
            Unzip the downloaded file. You'll get a folder called <code style={{ fontFamily: "var(--mono)", fontSize: 12, background: "var(--bg-2)", padding: "2px 6px", borderRadius: 4 }}>flight-tracker-extension</code>. Remember where you put it — Chrome needs the folder path.
          </p>
        </div>
      </div>

      {/* Step 3: Load in Chrome */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head">
          <div className="panel-title">Step 3 — Load in Chrome</div>
        </div>
        <div style={{ padding: "20px 20px" }}>
          <ol style={{ fontSize: 13, color: "var(--fg-2)", margin: 0, paddingLeft: 20, lineHeight: 2 }}>
            <li>Open Chrome and go to <code style={{ fontFamily: "var(--mono)", fontSize: 12, background: "var(--bg-2)", padding: "2px 6px", borderRadius: 4 }}>chrome://extensions</code></li>
            <li>Turn on <strong>Developer mode</strong> (toggle in the top-right corner)</li>
            <li>Click <strong>Load unpacked</strong></li>
            <li>Select the <code style={{ fontFamily: "var(--mono)", fontSize: 12, background: "var(--bg-2)", padding: "2px 6px", borderRadius: 4 }}>flight-tracker-extension</code> folder</li>
          </ol>
          <p style={{ fontSize: 13, color: "var(--fg-3)", margin: "14px 0 0", fontStyle: "italic" }}>
            That's it. The extension icon will appear in your Chrome toolbar. Refresh this page — ftrack will detect it automatically.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head">
          <div className="panel-title">How it works</div>
        </div>
        <div style={{ padding: "20px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div style={{ padding: "14px", background: "var(--bg-2)", borderRadius: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Daily auto-fetch</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.5 }}>
                When you open Chrome each day, the extension automatically fetches the latest flight prices in the background.
              </div>
            </div>
            <div style={{ padding: "14px", background: "var(--bg-2)", borderRadius: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Your residential IP</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.5 }}>
                Prices are fetched from your browser using your home internet. No servers, no cloud costs, no IP blocking.
              </div>
            </div>
            <div style={{ padding: "14px", background: "var(--bg-2)", borderRadius: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Shared with friends</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.5 }}>
                Multiple people can install the extension. The first person online each day handles the fetch — everyone sees the results.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">FAQ</div>
        </div>
        <div style={{ padding: "20px 20px", fontSize: 13, color: "var(--fg-2)", lineHeight: 1.8 }}>
          <p style={{ margin: "0 0 10px" }}><strong>Is this safe?</strong> The extension only talks to Google Flights and your Convex database. No data is sent anywhere else. You can inspect the source code in the extension folder.</p>
          <p style={{ margin: "0 0 10px" }}><strong>Will Google block me?</strong> The extension makes ~7-14 requests per day from your residential IP. That's indistinguishable from normal browsing — Google won't notice.</p>
          <p style={{ margin: "0 0 10px" }}><strong>Do I need to keep Chrome open?</strong> No. The extension checks once when you open Chrome. If prices were already fetched today (by you or a friend), it skips.</p>
          <p style={{ margin: 0 }}><strong>Can I remove it?</strong> Go to <code style={{ fontFamily: "var(--mono)", fontSize: 12, background: "var(--bg-2)", padding: "2px 6px", borderRadius: 4 }}>chrome://extensions</code> and click Remove. No traces left.</p>
        </div>
      </div>
    </>
  );
}
