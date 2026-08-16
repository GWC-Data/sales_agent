import { useApiResource } from "./useApiResource";
import { fetchDashboard, fetchReps, fetchCoachingTasks, fetchRecognitionNominations } from "../lib/agent7";

export function useCoachingDashboard() {
  const { data, status, error, reload } = useApiResource(fetchDashboard, { rows: [], metrics: { reps_below_target: 0, avg_gap_size: 0 } });
  return { rows: data.rows || [], metrics: data.metrics || {}, status, error, reload };
}
export function useCoachingReps() {
  const { data: reps, status, error, reload } = useApiResource(fetchReps);
  return { reps, status, error, reload };
}
export function useCoachingTasks() {
  const { data: tasks, status, error, reload } = useApiResource(fetchCoachingTasks);
  return { tasks, status, error, reload };
}
export function useRecognitionNominations() {
  const { data: nominations, status, error, reload } = useApiResource(fetchRecognitionNominations);
  return { nominations, status, error, reload };
}
