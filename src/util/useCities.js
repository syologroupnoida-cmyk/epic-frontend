import { useEffect, useState } from "react";
import { getPublicCatalog } from "@/util/publicCatalog.mjs";
import { loadAllCities } from "@/util/cities.mjs";

let cityRequest;
let cachedAt = 0;

function requestCities(refresh = false) {
  if (refresh || !cityRequest || Date.now() - cachedAt > 60000) {
    cachedAt = Date.now();
    cityRequest = loadAllCities(getPublicCatalog).catch((error) => {
      cityRequest = undefined;
      throw error;
    });
  }
  return cityRequest;
}

export default function useCities(enabled = true) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ cities: [], loading: true, error: "" });
  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    requestCities(attempt > 0).then((cities) => {
      if (mounted) setState({ cities, loading: false, error: "" });
    }).catch(() => {
      if (mounted) setState({ cities: [], loading: false, error: "Unable to load cities. Please try again." });
    });
    return () => { mounted = false; };
  }, [enabled, attempt]);
  return { ...state, retry: () => { setState((current) => ({ ...current, loading: true, error: "" })); setAttempt((current) => current + 1); } };
}
