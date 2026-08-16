import { useCallback, useEffect, useState } from "react";
import { fetchAccountSignals } from "../lib/agent6";

// Signals are fetched per-account (unlike the bulk resources), so this can't
// reuse useApiResource's zero-arg fetchFn — it re-fetches whenever accountId changes.
export function useAccountSignals(accountId) {
  const [signals, setSignals] = useState([]);
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!accountId) {
      setSignals([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const data = await fetchAccountSignals(accountId);
      setSignals(Array.isArray(data) ? data : []);
      setStatus("success");
    } catch (err) {
      setError(err?.message || "Failed to load signals");
      setStatus("error");
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  return { signals, status, error, reload: load };
}
