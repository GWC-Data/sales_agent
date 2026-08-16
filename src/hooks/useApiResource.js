import { useCallback, useEffect, useState } from "react";

// Shared fetching pattern: call `fetchFn`, expose the result plus a
// loading/success/error status and a manual `reload`. `initialValue` is both
// the pre-load default and the fallback used if the API returns nothing —
// pass `[]` for list endpoints (the default) or `{}` for object-shaped ones.
export function useApiResource(fetchFn, initialValue = []) {
  const [data, setData] = useState(initialValue);
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const result = await fetchFn();
      setData(result ?? initialValue);
      setStatus("success");
    } catch (err) {
      setError(err?.message || "Failed to load data");
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFn]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, status, error, reload: load };
}
