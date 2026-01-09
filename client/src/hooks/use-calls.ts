import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { Call } from "@shared/schema";

export function useCalls() {
  const query = useQuery({
    queryKey: [api.calls.list.path],
    queryFn: async () => {
      const res = await fetch(api.calls.list.path);
      if (!res.ok) throw new Error("Failed to fetch calls");
      return res.json() as Promise<Call[]>;
    },
  });

  // Count completed calls
  const completedCalls = (query.data || []).filter(call =>
    call.status === 'completed' || call.status === 'answered'
  ).length;

  return {
    calls: query.data || [],
    isLoading: query.isLoading,
    completedCalls,
  };
}
