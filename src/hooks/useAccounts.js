import { useApiResource } from "./useApiResource";
import { fetchAccounts } from "../lib/agent6";

export function useAccounts() {
  const { data: accounts, status, error, reload } = useApiResource(fetchAccounts);
  return { accounts, status, error, reload };
}
