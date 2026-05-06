export const fmtMoney = (n: number, cur = "USD") => {
  const sym = cur === "USD" ? "$" : cur === "EUR" ? "\u20ac" : cur === "GBP" ? "\u00a3" : cur + " ";
  return sym + Math.round(n).toLocaleString();
};

export const fmtDate = (d: Date | string) => {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const fmtWeekday = (d: Date | string) => {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
};

export const dayOfMonth = (d: Date | string) => {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.getDate();
};

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};
