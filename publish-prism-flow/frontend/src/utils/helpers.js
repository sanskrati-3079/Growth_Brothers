export const cls = (...xs) => xs.filter(Boolean).join(" ");
export const truncate = (s, n = 80) => (s.length > n ? s.slice(0, n) + "…" : s);
