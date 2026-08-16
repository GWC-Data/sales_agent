import { useApiResource } from "./useApiResource";
import { fetchProductCatalog } from "../lib/agent6";

export function useProductCatalog() {
  const { data: products, status, error, reload } = useApiResource(fetchProductCatalog);
  return { products, status, error, reload };
}
