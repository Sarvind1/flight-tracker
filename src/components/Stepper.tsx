"use client";

export function Stepper({ value, onChange, min = 1, max = 9 }: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Decrease">{"\u2212"}</button>
      <input value={value} onChange={e => {
        const n = parseInt(e.target.value || "0", 10);
        if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
      }}/>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label="Increase">+</button>
    </div>
  );
}
