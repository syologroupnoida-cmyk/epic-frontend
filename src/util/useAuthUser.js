import { useMemo, useSyncExternalStore } from "react";
import { getAuthUser } from "@/util/authSession";

function subscribe(callback) {
  window.addEventListener("epic-auth-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("epic-auth-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return JSON.stringify(getAuthUser());
}

function getServerSnapshot() { return "null"; }

export default function useAuthUser() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => JSON.parse(snapshot), [snapshot]);
}
