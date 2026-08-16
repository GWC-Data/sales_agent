import { useApiResource } from "./useApiResource";
import { fetchUpcomingMeetings } from "../lib/agent3";

export function useUpcomingMeetings() {
  const { data: meetings, status, error, reload } = useApiResource(fetchUpcomingMeetings);
  return { meetings, status, error, reload };
}
