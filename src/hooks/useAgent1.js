import { useApiResource } from "./useApiResource";
import { fetchDealQueue, fetchDealAuditLog } from "../lib/agent1";

export function useDealQueue() {
  const { data, status, error, reload } = useApiResource(
    fetchDealQueue,
    { deals: [], total_pending: 0, exception_count: 0, escalated_count: 0, upsell_count: 0, downsell_count: 0 },
  );
  return { ...data, status, error, reload };
}
export function useDealAuditLog() {
  const { data: entries, status, error, reload } = useApiResource(fetchDealAuditLog);
  return { entries, status, error, reload };
}
