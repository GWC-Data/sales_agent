import { useApiResource } from "./useApiResource";
import { fetchRenewalQueue, fetchTriggerLog } from "../lib/agent4";

const EMPTY_QUEUE = {
  renewals: [], total_backlog_value: 0, backlog_completeness_pct: 100,
  at_risk_count: 0, expired_count: 0,
  due_within_30_count: 0, due_31_to_60_count: 0, due_61_to_90_count: 0, due_beyond_90_count: 0,
};

export function useRenewalQueue() {
  const { data, status, error, reload } = useApiResource(fetchRenewalQueue, EMPTY_QUEUE);
  return { ...data, status, error, reload };
}
export function useTriggerLog() {
  const { data: entries, status, error, reload } = useApiResource(fetchTriggerLog);
  return { entries, status, error, reload };
}
