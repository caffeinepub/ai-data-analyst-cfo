import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ReportType } from "../backend.d";
import { useActor } from "./useActor";

export function useGetDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllReportSessions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["reportSessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReportSessions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllDatasetSessions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["datasetSessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDatasetSessions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateReportSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      name: string;
      reportType: ReportType;
      formData: string;
      results: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createReportSession(
        args.id,
        args.name,
        args.reportType,
        args.formData,
        args.results,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportSessions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useCreateDatasetSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      name: string;
      rawData: string;
      analysisResults: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createDatasetSession(
        args.id,
        args.name,
        args.rawData,
        args.analysisResults,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasetSessions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useDeleteReportSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteReportSession(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportSessions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useDeleteDatasetSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteDatasetSession(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasetSessions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export { ReportType };
