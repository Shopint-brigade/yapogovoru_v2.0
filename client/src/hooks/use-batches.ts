import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertBatch } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useBatches() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: [api.batches.list.path],
    queryFn: async () => {
      const res = await fetch(api.batches.list.path);
      if (!res.ok) throw new Error("Failed to fetch batches");
      return api.batches.list.responses[200].parse(await res.json());
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<InsertBatch, "userId">) => {
      const res = await fetch(api.batches.create.path, {
        method: api.batches.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400 || res.status === 403) {
           const error = await res.json();
           throw new Error(error.message);
        }
        throw new Error("Failed to create batch");
      }
      return api.batches.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.batches.list.path] });
      toast({ title: "Успешно", description: "Пакет звонков создан" });
    },
    onError: (error) => {
      // Don't show toast for batch size limit errors - they'll be handled by the dialog
      if (!error.message.includes('Превышен лимит записей')) {
        toast({ variant: "destructive", title: "Ошибка", description: error.message });
      }
    },
  });

  return {
    batches: query.data || [],
    isLoading: query.isLoading,
    createBatch: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}

export function useBatch(id: number) {
  return useQuery({
    queryKey: [api.batches.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.batches.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch batch details");
      return api.batches.get.responses[200].parse(await res.json());
    },
  });
}
