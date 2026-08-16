import { useApiResource } from "./useApiResource";
import { fetchApplications, fetchApplicationsQueue, fetchProgramCriteria } from "../lib/agent5";

export function usePartnerApplications() {
  const { data: applications, status, error, reload } = useApiResource(fetchApplications);
  return { applications, status, error, reload };
}
export function useApplicationsQueue() {
  const { data, status, error, reload } = useApiResource(fetchApplicationsQueue, { rows: [], metrics: { applications_this_month: 0, approval_rate_by_track: {} } });
  return { rows: data.rows || [], metrics: data.metrics || {}, status, error, reload };
}
export function useProgramCriteria() {
  const { data, status, error, reload } = useApiResource(fetchProgramCriteria, { Distributor: [], "Reseller/MSP": [] });
  return { criteria: data, status, error, reload };
}
