import { useSyncExternalStore } from "react";

export const noSubscribe = () => () => {};

/** False during server rendering and hydration, true once running in the browser. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
