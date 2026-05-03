import { useSyncExternalStore } from "react";

const removedExpiredUnitIds = new Set<string>();
const listeners = new Set<() => void>();
let snapshot: string[] = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): string[] {
  return snapshot;
}

export function useRemovedExpiredUnitIds(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function hideExpiredUnitFromView(unitId: string): void {
  const id = unitId.trim();
  if (!id || removedExpiredUnitIds.has(id)) return;
  removedExpiredUnitIds.add(id);
  snapshot = Array.from(removedExpiredUnitIds);
  emitChange();
}
