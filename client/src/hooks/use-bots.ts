import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Bot, InsertBot } from "@shared/schema";

export function useBots() {
  return useQuery<Bot[]>({
    queryKey: ["/api/bots"],
  });
}

export function useBot(id: string) {
  return useQuery<Bot>({
    queryKey: ["/api/bots", id],
    enabled: !!id,
  });
}

export function useCreateBot() {
  return useMutation({
    mutationFn: async (bot: InsertBot) => {
      const response = await apiRequest("POST", "/api/bots", bot);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
    },
  });
}

export function useUpdateBot() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Bot> }) => {
      const response = await apiRequest("PUT", `/api/bots/${id}`, updates);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bots", id] });
    },
  });
}

export function useDeleteBot() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/bots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
    },
  });
}
