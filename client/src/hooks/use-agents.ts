import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertAgent } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useAgents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: [api.agents.list.path],
    queryFn: async () => {
      const res = await fetch(api.agents.list.path);
      if (!res.ok) throw new Error("Failed to fetch agents");
      return api.agents.list.responses[200].parse(await res.json());
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<InsertAgent, "userId">) => {
      const res = await fetch(api.agents.create.path, {
        method: api.agents.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
           const error = api.agents.create.responses[400].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to create agent");
      }
      return api.agents.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.agents.list.path] });
      toast({ title: "Успешно", description: "Агент создан" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Ошибка", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<InsertAgent, "userId">> }) => {
      const url = buildUrl(api.agents.update.path, { id });
      const res = await fetch(url, {
        method: api.agents.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
           const error = api.agents.update.responses[400].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to update agent");
      }
      return api.agents.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.agents.list.path] });
      toast({ title: "Успешно", description: "Агент обновлен" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Ошибка", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.agents.delete.path, { id });
      const res = await fetch(url, { method: api.agents.delete.method });
      if (!res.ok) throw new Error("Failed to delete agent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.agents.list.path] });
      toast({ title: "Успешно", description: "Агент удален" });
    },
  });

  return {
    agents: query.data || [],
    isLoading: query.isLoading,
    createAgent: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateAgent: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteAgent: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
