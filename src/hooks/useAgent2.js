import { useApiResource } from "./useApiResource";
import { fetchOpportunities, fetchReps } from "../lib/agent2";

export function useNcaOpportunities() {
  const { data: opportunities, status, error, reload } = useApiResource(fetchOpportunities);
  return { opportunities, status, error, reload };
}
export function useNcaReps() {
  const { data: reps, status, error, reload } = useApiResource(fetchReps);
  return { reps, status, error, reload };
}
