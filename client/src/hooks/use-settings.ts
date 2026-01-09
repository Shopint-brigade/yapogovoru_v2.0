import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertSettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path);
      if (!res.ok) throw new Error("Failed to fetch settings");
      return api.settings.get.responses[200].parse(await res.json());
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Omit<InsertSettings, "userId">) => {
      const res = await fetch(api.settings.update.path, {
        method: api.settings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
           const error = api.settings.update.responses[400].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to update settings");
      }
      return api.settings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.get.path] });
      toast({ title: "Успешно", description: "Настройки сохранены" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Ошибка", description: error.message });
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
