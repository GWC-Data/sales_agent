import { useApiResource } from "./useApiResource";
import { fetchOpportunities } from "../lib/agent6";

export function useOpportunities() {
  const { data: opportunities, status, error, reload } = useApiResource(fetchOpportunities);
  return { opportunities, status, error, reload };
}
