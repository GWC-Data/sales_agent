import { useApiResource } from "./useApiResource";
import { fetchTickets } from "../lib/agent6";

export function useTickets() {
  const { data: tickets, status, error, reload } = useApiResource(fetchTickets);
  return { tickets, status, error, reload };
}
