import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { CallWithDetails } from "@shared/schema";

export function useCalls() {
  return useQuery<CallWithDetails[]>({
    queryKey: ["/api/calls"],
  });
}

export function useCall(id: string) {
  return useQuery<CallWithDetails>({
    queryKey: ["/api/calls", id],
    enabled: !!id,
  });
}

export function useUpdateCall() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CallWithDetails> }) => {
      const response = await apiRequest("PUT", `/api/calls/${id}`, updates);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calls", id] });
    },
  });
}

export function useCallStats() {
  return useQuery({
    queryKey: ["/api/stats"],
  });
}
