export const isNonEmpty = (s) => typeof s === "string" && s.trim().length > 0;
export const isFutureISO = (iso) => !isNaN(Date.parse(iso)) && new Date(iso) > new Date();
