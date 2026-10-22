export type Obj = Record<string, unknown>;

export const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

/** A string with something other than whitespace in it. */
export const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
